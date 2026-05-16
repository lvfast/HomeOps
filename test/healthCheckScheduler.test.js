const test = require("node:test");
const assert = require("node:assert/strict");

const {
  createHealthCheckScheduler,
  isServiceDueForCheck,
  runDueHealthChecks,
} = require("../src/workers/healthCheckScheduler");

test("isServiceDueForCheck returns true when a service has never been checked", () => {
  assert.equal(
    isServiceDueForCheck({
      lastCheckedAt: null,
      intervalSeconds: 60,
    }),
    true,
  );
});

test("isServiceDueForCheck returns false when the interval has not passed", () => {
  const now = new Date("2026-05-16T12:00:30.000Z");

  assert.equal(
    isServiceDueForCheck(
      {
        lastCheckedAt: new Date("2026-05-16T12:00:00.000Z"),
        intervalSeconds: 60,
      },
      now,
    ),
    false,
  );
});

test("isServiceDueForCheck returns true when the interval has passed", () => {
  const now = new Date("2026-05-16T12:01:00.000Z");

  assert.equal(
    isServiceDueForCheck(
      {
        lastCheckedAt: new Date("2026-05-16T12:00:00.000Z"),
        intervalSeconds: 60,
      },
      now,
    ),
    true,
  );
});

test("runDueHealthChecks checks only active services that are due", async () => {
  const checkedServiceIds = [];
  const now = new Date("2026-05-16T12:01:00.000Z");
  const prisma = {
    service: {
      findMany: async () => [
        {
          id: "due-service",
          isActive: true,
          lastCheckedAt: new Date("2026-05-16T12:00:00.000Z"),
          intervalSeconds: 60,
        },
        {
          id: "skipped-service",
          isActive: true,
          lastCheckedAt: new Date("2026-05-16T12:00:45.000Z"),
          intervalSeconds: 60,
        },
      ],
    },
  };

  const result = await runDueHealthChecks({
    prisma,
    now,
    checkServiceFn: async (receivedPrisma, service) => {
      assert.equal(receivedPrisma, prisma);
      checkedServiceIds.push(service.id);
    },
  });

  assert.deepEqual(checkedServiceIds, ["due-service"]);
  assert.deepEqual(result, {
    checkedCount: 1,
    failedCount: 0,
    skippedCount: 1,
  });
});

test("runDueHealthChecks keeps checking other services when one check fails", async () => {
  const loggedErrors = [];
  const prisma = {
    service: {
      findMany: async () => [
        {
          id: "failing-service",
          isActive: true,
          lastCheckedAt: null,
          intervalSeconds: 60,
        },
        {
          id: "healthy-service",
          isActive: true,
          lastCheckedAt: null,
          intervalSeconds: 60,
        },
      ],
    },
  };

  const result = await runDueHealthChecks({
    prisma,
    checkServiceFn: async (receivedPrisma, service) => {
      if (service.id === "failing-service") {
        throw new Error("Network error");
      }
    },
    logger: {
      error: (message) => loggedErrors.push(message),
    },
  });

  assert.deepEqual(result, {
    checkedCount: 1,
    failedCount: 1,
    skippedCount: 0,
  });
  assert.equal(loggedErrors.length, 1);
  assert.match(loggedErrors[0], /failing-service/);
});

test("createHealthCheckScheduler skips overlapping ticks", async () => {
  let releaseTick;
  let callCount = 0;
  const scheduler = createHealthCheckScheduler({
    prisma: {},
    pollIntervalSeconds: 60,
    runDueHealthChecksFn: async () => {
      callCount += 1;
      await new Promise((resolve) => {
        releaseTick = resolve;
      });
    },
    logger: {
      warn: () => {},
      error: () => {},
    },
  });

  const firstTick = scheduler.tick();
  const secondTick = scheduler.tick();

  assert.equal(await secondTick, null);
  assert.equal(callCount, 1);

  releaseTick();
  await firstTick;
});
