const test = require("node:test");
const assert = require("node:assert/strict");

const { buildServiceStatusUpdate } = require("../src/services/serviceStatus");

test("buildServiceStatusUpdate marks a successful check as UP", () => {
  const checkedAt = new Date("2026-05-16T10:00:00.000Z");

  const update = buildServiceStatusUpdate(
    {
      currentStatus: "UNKNOWN",
      consecutiveFailures: 2,
      failureThreshold: 3,
    },
    { status: "SUCCESS" },
    checkedAt,
  );

  assert.deepEqual(update, {
    currentStatus: "UP",
    consecutiveFailures: 0,
    lastCheckedAt: checkedAt,
    lastSuccessAt: checkedAt,
  });
});

test("buildServiceStatusUpdate keeps a service from going DOWN before the failure threshold", () => {
  const checkedAt = new Date("2026-05-16T10:00:00.000Z");

  const update = buildServiceStatusUpdate(
    {
      currentStatus: "UP",
      consecutiveFailures: 1,
      failureThreshold: 3,
    },
    { status: "FAILURE" },
    checkedAt,
  );

  assert.deepEqual(update, {
    currentStatus: "UP",
    consecutiveFailures: 2,
    lastCheckedAt: checkedAt,
    lastFailureAt: checkedAt,
  });
});

test("buildServiceStatusUpdate marks a service DOWN when failures reach the threshold", () => {
  const checkedAt = new Date("2026-05-16T10:00:00.000Z");

  const update = buildServiceStatusUpdate(
    {
      currentStatus: "UP",
      consecutiveFailures: 2,
      failureThreshold: 3,
    },
    { status: "FAILURE" },
    checkedAt,
  );

  assert.deepEqual(update, {
    currentStatus: "DOWN",
    consecutiveFailures: 3,
    lastCheckedAt: checkedAt,
    lastFailureAt: checkedAt,
  });
});

test("buildServiceStatusUpdate recovers a DOWN service after a successful check", () => {
  const checkedAt = new Date("2026-05-16T10:00:00.000Z");

  const update = buildServiceStatusUpdate(
    {
      currentStatus: "DOWN",
      consecutiveFailures: 3,
      failureThreshold: 3,
    },
    { status: "SUCCESS" },
    checkedAt,
  );

  assert.deepEqual(update, {
    currentStatus: "UP",
    consecutiveFailures: 0,
    lastCheckedAt: checkedAt,
    lastSuccessAt: checkedAt,
  });
});
