const { runHealthCheck } = require("../healthChecks/runHealthCheck");
const { applyIncidentLifecycle } = require("./incidentLifecycle");
const { buildServiceStatusUpdate } = require("./serviceStatus");

async function checkService(
  prisma,
  service,
  {
    runHealthCheckFn = runHealthCheck,
    incidentLifecycleFn = applyIncidentLifecycle,
  } = {},
) {
  const result = await runHealthCheckFn(service);

  return runTransaction(prisma, async (tx) => {
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

    await incidentLifecycleFn(tx, {
      service,
      updatedService,
      checkedAt: healthCheck.checkedAt,
    });

    return {
      healthCheck,
      service: updatedService,
    };
  });
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
