const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const request = require("supertest");

const { createApp } = require("../src/app");
const { createPrismaClient } = require("../src/db");

const prisma = createPrismaClient();
const app = createApp({ prisma });
const createdServiceIds = [];

test.after(async () => {
  if (createdServiceIds.length > 0) {
    await prisma.service.deleteMany({
      where: {
        id: {
          in: createdServiceIds,
        },
      },
    });
  }

  await prisma.$disconnect();
});

test("incident lifecycle opens, acknowledges, and resolves an incident", async () => {
  const testServer = await startTestHttpServer((req, res) => {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "error" }));
  });

  try {
    const service = await createMonitoredService({
      name: "Incident API",
      url: `${testServer.url}/health`,
      failureThreshold: 1,
    });

    const checkResponse = await request(app).post(`/services/${service.id}/check`);

    assert.equal(checkResponse.status, 201);
    assert.equal(checkResponse.body.service.currentStatus, "DOWN");

    const incident = await prisma.incident.findFirst({
      where: { serviceId: service.id },
    });

    assert.equal(incident.title, "Incident API is down");
    assert.equal(incident.status, "OPEN");
    assert.equal(incident.severity, "SEV2");

    const listResponse = await request(app).get("/incidents");

    assert.equal(listResponse.status, 200);
    assert.equal(
      listResponse.body.incidents.some((item) => item.id === incident.id),
      true,
    );

    const getResponse = await request(app).get(`/incidents/${incident.id}`);

    assert.equal(getResponse.status, 200);
    assert.equal(getResponse.body.incident.id, incident.id);

    const eventsResponse = await request(app).get(
      `/incidents/${incident.id}/events`,
    );

    assert.equal(eventsResponse.status, 200);
    assert.equal(eventsResponse.body.events.length, 1);
    assert.equal(eventsResponse.body.events[0].type, "CREATED");

    const acknowledgeResponse = await request(app).post(
      `/incidents/${incident.id}/acknowledge`,
    );

    assert.equal(acknowledgeResponse.status, 200);
    assert.equal(acknowledgeResponse.body.incident.status, "ACKNOWLEDGED");

    const resolveResponse = await request(app).post(
      `/incidents/${incident.id}/resolve`,
    );

    assert.equal(resolveResponse.status, 200);
    assert.equal(resolveResponse.body.incident.status, "RESOLVED");
    assert.equal(typeof resolveResponse.body.incident.resolvedAt, "string");
    assert.equal(
      Number.isInteger(resolveResponse.body.incident.durationSeconds),
      true,
    );

    const resolvedEventsResponse = await request(app).get(
      `/incidents/${incident.id}/events`,
    );

    assert.equal(resolvedEventsResponse.status, 200);
    assert.deepEqual(
      resolvedEventsResponse.body.events.map((event) => event.type),
      ["CREATED", "ACKNOWLEDGED", "RESOLVED"],
    );
  } finally {
    await testServer.close();
  }
});

test("incident lifecycle avoids duplicate active incidents for repeated failures", async () => {
  const testServer = await startTestHttpServer((req, res) => {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "error" }));
  });

  try {
    const service = await createMonitoredService({
      name: "Repeated Failure API",
      url: `${testServer.url}/health`,
      failureThreshold: 1,
    });

    await request(app).post(`/services/${service.id}/check`);
    await request(app).post(`/services/${service.id}/check`);

    const activeIncidents = await prisma.incident.findMany({
      where: {
        serviceId: service.id,
        status: { in: ["OPEN", "ACKNOWLEDGED"] },
      },
    });

    assert.equal(activeIncidents.length, 1);
  } finally {
    await testServer.close();
  }
});

test("incident lifecycle resolves an active incident when a service recovers", async () => {
  let statusCode = 500;
  const testServer = await startTestHttpServer((req, res) => {
    res.writeHead(statusCode, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: statusCode }));
  });

  try {
    const service = await createMonitoredService({
      name: "Recovering Incident API",
      url: `${testServer.url}/health`,
      failureThreshold: 1,
    });

    await request(app).post(`/services/${service.id}/check`);

    const incident = await prisma.incident.findFirst({
      where: { serviceId: service.id },
    });

    assert.equal(incident.status, "OPEN");

    statusCode = 200;

    const recoveryResponse = await request(app).post(
      `/services/${service.id}/check`,
    );

    assert.equal(recoveryResponse.status, 201);
    assert.equal(recoveryResponse.body.service.currentStatus, "UP");

    const resolvedIncident = await prisma.incident.findUnique({
      where: { id: incident.id },
    });

    assert.equal(resolvedIncident.status, "RESOLVED");
    assert.equal(resolvedIncident.resolvedAt instanceof Date, true);
    assert.equal(Number.isInteger(resolvedIncident.durationSeconds), true);

    const events = await prisma.incidentEvent.findMany({
      where: { incidentId: incident.id },
      orderBy: { createdAt: "asc" },
    });

    assert.deepEqual(
      events.map((event) => event.type),
      ["CREATED", "RESOLVED"],
    );
  } finally {
    await testServer.close();
  }
});

test("incident routes return 404 for a missing incident", async () => {
  const getResponse = await request(app).get("/incidents/missing-incident-id");

  assert.equal(getResponse.status, 404);
  assert.deepEqual(getResponse.body, {
    error: "Not Found",
    message: "Incident not found",
  });

  const eventsResponse = await request(app).get(
    "/incidents/missing-incident-id/events",
  );

  assert.equal(eventsResponse.status, 404);
  assert.deepEqual(eventsResponse.body, {
    error: "Not Found",
    message: "Incident not found",
  });
});

async function createMonitoredService({ name, url, failureThreshold }) {
  const response = await request(app).post("/services").send({
    name,
    url,
    expectedStatusCode: 200,
    intervalSeconds: 60,
    timeoutSeconds: 5,
    failureThreshold,
  });

  assert.equal(response.status, 201);
  createdServiceIds.push(response.body.service.id);

  return response.body.service;
}

async function startTestHttpServer(handler) {
  const server = http.createServer(handler);

  await new Promise((resolve) => {
    server.listen(0, "127.0.0.1", resolve);
  });

  const address = server.address();

  return {
    url: `http://127.0.0.1:${address.port}`,
    close: () =>
      new Promise((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      }),
  };
}
