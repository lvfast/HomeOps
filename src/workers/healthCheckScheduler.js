const { checkService } = require("../services/checkService");

function isServiceDueForCheck(service, now = new Date()) {
  if (!service.lastCheckedAt) {
    return true;
  }

  const nextCheckAt =
    new Date(service.lastCheckedAt).getTime() + service.intervalSeconds * 1000;

  return nextCheckAt <= now.getTime();
}

async function runDueHealthChecks({
  prisma,
  now = new Date(),
  checkServiceFn = checkService,
  logger = console,
}) {
  const activeServices = await prisma.service.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
  });
  const dueServices = activeServices.filter((service) =>
    isServiceDueForCheck(service, now),
  );
  let failedCount = 0;

  for (const service of dueServices) {
    try {
      await checkServiceFn(prisma, service);
    } catch (error) {
      failedCount += 1;
      logger.error(
        `Health check worker failed for service ${service.id}: ${error.message}`,
      );
    }
  }

  return {
    checkedCount: dueServices.length - failedCount,
    failedCount,
    skippedCount: activeServices.length - dueServices.length,
  };
}

function createHealthCheckScheduler({
  prisma,
  pollIntervalSeconds,
  runDueHealthChecksFn = runDueHealthChecks,
  logger = console,
}) {
  let timer = null;
  let isTickRunning = false;

  async function tick() {
    if (isTickRunning) {
      logger.warn("Health check worker tick skipped because one is still running");
      return null;
    }

    isTickRunning = true;

    try {
      return await runDueHealthChecksFn({ prisma, logger });
    } catch (error) {
      logger.error(`Health check worker tick failed: ${error.message}`);
      return null;
    } finally {
      isTickRunning = false;
    }
  }

  function start() {
    if (timer) {
      return;
    }

    void tick();
    timer = setInterval(() => {
      void tick();
    }, pollIntervalSeconds * 1000);

    if (typeof timer.unref === "function") {
      timer.unref();
    }
  }

  function stop() {
    if (!timer) {
      return;
    }

    clearInterval(timer);
    timer = null;
  }

  function isStarted() {
    return timer !== null;
  }

  return {
    start,
    stop,
    tick,
    isStarted,
  };
}

module.exports = {
  createHealthCheckScheduler,
  isServiceDueForCheck,
  runDueHealthChecks,
};
