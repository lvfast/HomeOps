const { runHealthCheck } = require("../healthChecks/runHealthCheck");
const { applyIncidentLifecycle } = require("./incidentLifecycle");
const { sendIncidentNotification } = require("./notifications");
const { buildServiceStatusUpdate } = require("./serviceStatus");

async function checkService(
  prisma,
  service,
  {
    runHealthCheckFn = runHealthCheck,
    incidentLifecycleFn = applyIncidentLifecycle,
    notificationFn = sendIncidentNotification,
  } = {},
) {
  const result = await runHealthCheckFn(service);

  const checkResult = await runTransaction(prisma, async (tx) => {
    const healthCheck = await tx.healthCheck.create({
      data: {
        serviceId: service.id,
        status: result.status,
        statusCode: result.statusCode,
        responseTimeMs: result.responseTimeMs,
        errorMessage: result.errorMessage,
      },
    });
    const updatedService = await tx.service.update({
      where: { id: service.id },
      data: buildServiceStatusUpdate(service, result, healthCheck.checkedAt),
    });

    const incidentLifecycleResult = await incidentLifecycleFn(tx, {
      service,
      updatedService,
      checkedAt: healthCheck.checkedAt,
    });

    return {
      healthCheck,
      incidentLifecycleResult,
      service: updatedService,
    };
  });

  if (checkResult.incidentLifecycleResult) {
    await notificationFn(prisma, checkResult.incidentLifecycleResult);
  }

  return {
    healthCheck: checkResult.healthCheck,
    service: checkResult.service,
  };
}

async function runTransaction(prisma, callback) {
  if (typeof prisma.$transaction === "function") {
    return prisma.$transaction(callback);
  }

  return callback(prisma);
}

module.exports = {
  checkService,
};
