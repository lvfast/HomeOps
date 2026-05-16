function buildServiceStatusUpdate(service, healthCheckResult, checkedAt = new Date()) {
  if (healthCheckResult.status === "SUCCESS") {
    return {
      currentStatus: "UP",
      consecutiveFailures: 0,
      lastCheckedAt: checkedAt,
      lastSuccessAt: checkedAt,
    };
  }

  const consecutiveFailures = service.consecutiveFailures + 1;
  const currentStatus =
    consecutiveFailures >= service.failureThreshold
      ? "DOWN"
      : service.currentStatus;

  return {
    currentStatus,
    consecutiveFailures,
    lastCheckedAt: checkedAt,
    lastFailureAt: checkedAt,
  };
}

module.exports = {
  buildServiceStatusUpdate,
};
