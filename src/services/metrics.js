const allowedRanges = new Map([
  ["1h", { hours: 1 }],
  ["24h", { hours: 24 }],
  ["7d", { days: 7 }],
  ["30d", { days: 30 }],
]);

function parseMetricsRange(value, now = new Date()) {
  const range = value || "24h";
  const duration = allowedRanges.get(range);

  if (!duration) {
    return {
      ok: false,
      message: "Range must be one of: 1h, 24h, 7d, 30d",
    };
  }

  const milliseconds =
    (duration.hours || 0) * 60 * 60 * 1000 +
    (duration.days || 0) * 24 * 60 * 60 * 1000;

  return {
    ok: true,
    range,
    startedAt: new Date(now.getTime() - milliseconds),
  };
}

function calculateHealthCheckMetrics(healthChecks) {
  const totalChecks = healthChecks.length;
  const successfulChecks = healthChecks.filter(
    (healthCheck) => healthCheck.status === "SUCCESS",
  ).length;
  const failedChecks = totalChecks - successfulChecks;

  return {
    totalChecks,
    successfulChecks,
    failedChecks,
    uptimePercentage:
      totalChecks === 0
        ? null
        : Number(((successfulChecks / totalChecks) * 100).toFixed(2)),
    averageResponseTimeMs:
      totalChecks === 0
        ? null
        : Math.round(
            healthChecks.reduce(
              (sum, healthCheck) => sum + healthCheck.responseTimeMs,
              0,
            ) / totalChecks,
          ),
  };
}

function mapPublicServiceStatus(currentStatus) {
  if (currentStatus === "UP") {
    return "OPERATIONAL";
  }

  if (currentStatus === "DOWN") {
    return "MAJOR_OUTAGE";
  }

  return "UNKNOWN";
}

function getOverallPublicStatus(services) {
  if (services.some((service) => service.currentStatus === "DOWN")) {
    return "MAJOR_OUTAGE";
  }

  if (services.some((service) => service.currentStatus === "UNKNOWN")) {
    return "UNKNOWN";
  }

  return "OPERATIONAL";
}

module.exports = {
  calculateHealthCheckMetrics,
  getOverallPublicStatus,
  mapPublicServiceStatus,
  parseMetricsRange,
};
