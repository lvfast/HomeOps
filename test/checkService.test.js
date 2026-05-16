const test = require("node:test");
const assert = require("node:assert/strict");

const { checkService } = require("../src/services/checkService");

test("checkService saves a health check and updates the service status", async () => {
  const checkedAt = new Date("2026-05-16T12:00:00.000Z");
  const createdHealthCheck = {
    id: "health-check-1",
    serviceId: "service-1",
    status: "SUCCESS",
    statusCode: 200,
    responseTimeMs: 25,
    errorMessage: null,
    checkedAt,
  };
  const updatedService = {
    id: "service-1",
    currentStatus: "UP",
    consecutiveFailures: 0,
  };
  const createCalls = [];
  const updateCalls = [];
  const prisma = {
    healthCheck: {
      create: async (args) => {
        createCalls.push(args);
        return createdHealthCheck;
      },
    },
    service: {
      update: async (args) => {
        updateCalls.push(args);
        return updatedService;
      },
    },
  };

  const result = await checkService(
    prisma,
    {
      id: "service-1",
      currentStatus: "UNKNOWN",
      consecutiveFailures: 1,
      failureThreshold: 3,
    },
    {
      runHealthCheckFn: async () => ({
        status: "SUCCESS",
        statusCode: 200,
        responseTimeMs: 25,
        errorMessage: null,
      }),
    },
  );

  assert.deepEqual(createCalls, [
    {
      data: {
        serviceId: "service-1",
        status: "SUCCESS",
        statusCode: 200,
        responseTimeMs: 25,
        errorMessage: null,
      },
    },
  ]);
  assert.deepEqual(updateCalls, [
    {
      where: { id: "service-1" },
      data: {
        currentStatus: "UP",
        consecutiveFailures: 0,
        lastCheckedAt: checkedAt,
        lastSuccessAt: checkedAt,
      },
    },
  ]);
  assert.deepEqual(result, {
    healthCheck: createdHealthCheck,
    service: updatedService,
  });
});
