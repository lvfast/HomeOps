const { runHealthCheck } = require("../healthChecks/runHealthCheck");
const { buildServiceStatusUpdate } = require("./serviceStatus");

async function checkService(
  prisma,
  service,
  { runHealthCheckFn = runHealthCheck } = {},
) {
  const result = await runHealthCheckFn(service);
  const healthCheck = await prisma.healthCheck.create({
    data: {
      serviceId: service.id,
      status: result.status,
      statusCode: result.statusCode,
      responseTimeMs: result.responseTimeMs,
      errorMessage: result.errorMessage,
    },
  });
  const updatedService = await prisma.service.update({
    where: { id: service.id },
    data: buildServiceStatusUpdate(service, result, healthCheck.checkedAt),
  });

  return {
    healthCheck,
    service: updatedService,
  };
}

module.exports = {
  checkService,
};
