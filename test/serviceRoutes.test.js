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

test("service management flow creates, reads, updates, pauses, resumes, and deletes a service", async () => {
  const createResponse = await request(app).post("/services").send({
    name: "Example API",
    url: "https://example.com/health",
    expectedStatusCode: 200,
    intervalSeconds: 60,
    timeoutSeconds: 5,
    failureThreshold: 3,
  });

  assert.equal(createResponse.status, 201);
  assert.equal(createResponse.body.service.name, "Example API");
  assert.equal(createResponse.body.service.url, "https://example.com/health");
  assert.equal(createResponse.body.service.currentStatus, "UNKNOWN");
  assert.equal(createResponse.body.service.isActive, true);

  const serviceId = createResponse.body.service.id;
  createdServiceIds.push(serviceId);

  const listResponse = await request(app).get("/services");

  assert.equal(listResponse.status, 200);
  assert.equal(
    listResponse.body.services.some((service) => service.id === serviceId),
    true,
  );

  const getResponse = await request(app).get(`/services/${serviceId}`);

  assert.equal(getResponse.status, 200);
  assert.equal(getResponse.body.service.id, serviceId);

  const updateResponse = await request(app).patch(`/services/${serviceId}`).send({
    name: "Updated API",
    intervalSeconds: 30,
  });

  assert.equal(updateResponse.status, 200);
  assert.equal(updateResponse.body.service.name, "Updated API");
  assert.equal(updateResponse.body.service.intervalSeconds, 30);

  const pauseResponse = await request(app).post(`/services/${serviceId}/pause`);

  assert.equal(pauseResponse.status, 200);
  assert.equal(pauseResponse.body.service.isActive, false);

  const resumeResponse = await request(app).post(`/services/${serviceId}/resume`);

  assert.equal(resumeResponse.status, 200);
  assert.equal(resumeResponse.body.service.isActive, true);

  const deleteResponse = await request(app).delete(`/services/${serviceId}`);

  assert.equal(deleteResponse.status, 204);

  const getDeletedResponse = await request(app).get(`/services/${serviceId}`);

  assert.equal(getDeletedResponse.status, 404);
  assert.deepEqual(getDeletedResponse.body, {
    error: "Not Found",
    message: "Service not found",
  });
});

test("POST /services rejects an invalid URL", async () => {
  const response = await request(app).post("/services").send({
    name: "Invalid API",
    url: "not-a-url",
  });

  assert.equal(response.status, 400);
  assert.deepEqual(response.body, {
    error: "Bad Request",
    message: "Service URL must be a valid HTTP or HTTPS URL",
  });
});

test("POST /services/:id/check saves a successful health check", async () => {
  const testServer = await startTestHttpServer((req, res) => {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok" }));
  });

  try {
    const createResponse = await request(app).post("/services").send({
      name: "Healthy API",
      url: `${testServer.url}/health`,
      expectedStatusCode: 200,
      intervalSeconds: 60,
      timeoutSeconds: 5,
      failureThreshold: 3,
    });
    const serviceId = createResponse.body.service.id;
    createdServiceIds.push(serviceId);

    const checkResponse = await request(app).post(`/services/${serviceId}/check`);

    assert.equal(checkResponse.status, 201);
    assert.equal(checkResponse.body.healthCheck.serviceId, serviceId);
    assert.equal(checkResponse.body.healthCheck.status, "SUCCESS");
    assert.equal(checkResponse.body.healthCheck.statusCode, 200);
    assert.equal(checkResponse.body.healthCheck.errorMessage, null);
    assert.equal(checkResponse.body.service.id, serviceId);
    assert.equal(checkResponse.body.service.currentStatus, "UP");
    assert.equal(checkResponse.body.service.consecutiveFailures, 0);
    assert.equal(typeof checkResponse.body.service.lastCheckedAt, "string");
    assert.equal(typeof checkResponse.body.service.lastSuccessAt, "string");
    assert.equal(checkResponse.body.service.lastFailureAt, null);
    assert.equal(
      Number.isInteger(checkResponse.body.healthCheck.responseTimeMs),
      true,
    );

    const historyResponse = await request(app).get(
      `/services/${serviceId}/health-checks`,
    );

    assert.equal(historyResponse.status, 200);
    assert.equal(historyResponse.body.healthChecks.length, 1);
    assert.equal(historyResponse.body.healthChecks[0].status, "SUCCESS");
  } finally {
    await testServer.close();
  }
});

test("POST /services/:id/check saves a failed health check for unexpected status", async () => {
  const testServer = await startTestHttpServer((req, res) => {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "error" }));
  });

  try {
    const createResponse = await request(app).post("/services").send({
      name: "Failing API",
      url: `${testServer.url}/health`,
      expectedStatusCode: 200,
      intervalSeconds: 60,
      timeoutSeconds: 5,
      failureThreshold: 1,
    });
    const serviceId = createResponse.body.service.id;
    createdServiceIds.push(serviceId);

    const checkResponse = await request(app).post(`/services/${serviceId}/check`);

    assert.equal(checkResponse.status, 201);
    assert.equal(checkResponse.body.healthCheck.serviceId, serviceId);
    assert.equal(checkResponse.body.healthCheck.status, "FAILURE");
    assert.equal(checkResponse.body.healthCheck.statusCode, 500);
    assert.equal(
      checkResponse.body.healthCheck.errorMessage,
      "Expected status 200 but received 500",
    );
    assert.equal(checkResponse.body.service.id, serviceId);
    assert.equal(checkResponse.body.service.currentStatus, "DOWN");
    assert.equal(checkResponse.body.service.consecutiveFailures, 1);
    assert.equal(typeof checkResponse.body.service.lastCheckedAt, "string");
    assert.equal(checkResponse.body.service.lastSuccessAt, null);
    assert.equal(typeof checkResponse.body.service.lastFailureAt, "string");
  } finally {
    await testServer.close();
  }
});

test("POST /services/:id/check recovers a DOWN service after a successful health check", async () => {
  let responseStatusCode = 500;
  const testServer = await startTestHttpServer((req, res) => {
    res.writeHead(responseStatusCode, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: responseStatusCode }));
  });

  try {
    const createResponse = await request(app).post("/services").send({
      name: "Recovering API",
      url: `${testServer.url}/health`,
      expectedStatusCode: 200,
      intervalSeconds: 60,
      timeoutSeconds: 5,
      failureThreshold: 1,
    });
    const serviceId = createResponse.body.service.id;
    createdServiceIds.push(serviceId);

    const failedCheckResponse = await request(app).post(
      `/services/${serviceId}/check`,
    );

    assert.equal(failedCheckResponse.status, 201);
    assert.equal(failedCheckResponse.body.service.currentStatus, "DOWN");
    assert.equal(failedCheckResponse.body.service.consecutiveFailures, 1);

    responseStatusCode = 200;

    const recoveryCheckResponse = await request(app).post(
      `/services/${serviceId}/check`,
    );

    assert.equal(recoveryCheckResponse.status, 201);
    assert.equal(recoveryCheckResponse.body.healthCheck.status, "SUCCESS");
    assert.equal(recoveryCheckResponse.body.service.currentStatus, "UP");
    assert.equal(recoveryCheckResponse.body.service.consecutiveFailures, 0);
    assert.equal(
      typeof recoveryCheckResponse.body.service.lastSuccessAt,
      "string",
    );
  } finally {
    await testServer.close();
  }
});

test("GET /services/:id/health-checks returns 404 for a missing service", async () => {
  const response = await request(app).get(
    "/services/missing-service-id/health-checks",
  );

  assert.equal(response.status, 404);
  assert.deepEqual(response.body, {
    error: "Not Found",
    message: "Service not found",
  });
});

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
