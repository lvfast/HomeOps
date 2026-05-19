const test = require("node:test");
const assert = require("node:assert/strict");
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

test("GET /services/:id/metrics returns uptime metrics for a service", async () => {
  const service = await createService({
    name: "Metrics API",
    currentStatus: "UP",
  });

  await prisma.healthCheck.createMany({
    data: [
      {
        serviceId: service.id,
        status: "SUCCESS",
        statusCode: 200,
        responseTimeMs: 100,
        checkedAt: new Date(),
      },
      {
        serviceId: service.id,
        status: "FAILURE",
        statusCode: 500,
        responseTimeMs: 300,
        errorMessage: "Expected status 200 but received 500",
        checkedAt: new Date(),
      },
    ],
  });

  const response = await request(app).get(`/services/${service.id}/metrics`);

  assert.equal(response.status, 200);
  assert.equal(response.body.service.id, service.id);
  assert.equal(response.body.service.name, "Metrics API");
  assert.equal(response.body.range, "24h");
  assert.deepEqual(response.body.metrics, {
    totalChecks: 2,
    successfulChecks: 1,
    failedChecks: 1,
    uptimePercentage: 50,
    averageResponseTimeMs: 200,
  });
});

test("GET /services/:id/metrics rejects invalid ranges", async () => {
  const service = await createService({
    name: "Invalid Range API",
    currentStatus: "UNKNOWN",
  });

  const response = await request(app).get(
    `/services/${service.id}/metrics?range=90d`,
  );

  assert.equal(response.status, 400);
  assert.deepEqual(response.body, {
    error: "Bad Request",
    message: "Range must be one of: 1h, 24h, 7d, 30d",
  });
});

test("GET /services/:id/metrics returns 404 for a missing service", async () => {
  const response = await request(app).get("/services/missing-service-id/metrics");

  assert.equal(response.status, 404);
  assert.deepEqual(response.body, {
    error: "Not Found",
    message: "Service not found",
  });
});

test("GET /dashboard/summary returns service and incident counts", async () => {
  const upService = await createService({
    name: "Dashboard UP API",
    currentStatus: "UP",
  });
  await createService({
    name: "Dashboard DOWN API",
    currentStatus: "DOWN",
  });

  await prisma.incident.create({
    data: {
      serviceId: upService.id,
      title: "Dashboard UP API is down",
      severity: "SEV2",
      status: "OPEN",
      startedAt: new Date(),
    },
  });

  const response = await request(app).get("/dashboard/summary");

  assert.equal(response.status, 200);
  assert.equal(response.body.summary.services.total >= 2, true);
  assert.equal(response.body.summary.services.up >= 1, true);
  assert.equal(response.body.summary.services.down >= 1, true);
  assert.equal(response.body.summary.incidents.open >= 1, true);
  assert.equal(response.body.summary.incidents.active >= 1, true);
  assert.equal(Array.isArray(response.body.summary.recentIncidents), true);
});

test("GET /status returns public status for active services", async () => {
  const activeService = await createService({
    name: "Public Active API",
    currentStatus: "UP",
  });
  await createService({
    name: "Public Paused API",
    currentStatus: "DOWN",
    isActive: false,
  });

  const response = await request(app).get("/status");

  assert.equal(response.status, 200);
  assert.equal(
    response.body.services.some(
      (service) =>
        service.id === activeService.id && service.status === "OPERATIONAL",
    ),
    true,
  );
  assert.equal(
    response.body.services.some((service) => service.name === "Public Paused API"),
    false,
  );
});

async function createService({ name, currentStatus, isActive = true }) {
  const service = await prisma.service.create({
    data: {
      name,
      url: "https://example.com/health",
      expectedStatusCode: 200,
      intervalSeconds: 60,
      timeoutSeconds: 5,
      failureThreshold: 3,
      currentStatus,
      isActive,
    },
  });

  createdServiceIds.push(service.id);

  return service;
}
