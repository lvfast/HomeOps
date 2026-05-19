const test = require("node:test");
const assert = require("node:assert/strict");

const {
  calculateHealthCheckMetrics,
  getOverallPublicStatus,
  mapPublicServiceStatus,
  parseMetricsRange,
} = require("../src/services/metrics");

test("parseMetricsRange defaults to 24h", () => {
  const now = new Date("2026-05-19T12:00:00.000Z");
  const result = parseMetricsRange(undefined, now);

  assert.equal(result.ok, true);
  assert.equal(result.range, "24h");
  assert.equal(result.startedAt.toISOString(), "2026-05-18T12:00:00.000Z");
});

test("parseMetricsRange rejects unsupported ranges", () => {
  const result = parseMetricsRange("90d");

  assert.deepEqual(result, {
    ok: false,
    message: "Range must be one of: 1h, 24h, 7d, 30d",
  });
});

test("calculateHealthCheckMetrics summarizes checks", () => {
  const metrics = calculateHealthCheckMetrics([
    { status: "SUCCESS", responseTimeMs: 100 },
    { status: "SUCCESS", responseTimeMs: 200 },
    { status: "FAILURE", responseTimeMs: 300 },
  ]);

  assert.deepEqual(metrics, {
    totalChecks: 3,
    successfulChecks: 2,
    failedChecks: 1,
    uptimePercentage: 66.67,
    averageResponseTimeMs: 200,
  });
});

test("calculateHealthCheckMetrics handles empty history", () => {
  assert.deepEqual(calculateHealthCheckMetrics([]), {
    totalChecks: 0,
    successfulChecks: 0,
    failedChecks: 0,
    uptimePercentage: null,
    averageResponseTimeMs: null,
  });
});

test("public status helpers map service states", () => {
  assert.equal(mapPublicServiceStatus("UP"), "OPERATIONAL");
  assert.equal(mapPublicServiceStatus("DOWN"), "MAJOR_OUTAGE");
  assert.equal(mapPublicServiceStatus("UNKNOWN"), "UNKNOWN");

  assert.equal(
    getOverallPublicStatus([{ currentStatus: "UP" }, { currentStatus: "DOWN" }]),
    "MAJOR_OUTAGE",
  );
  assert.equal(
    getOverallPublicStatus([{ currentStatus: "UP" }, { currentStatus: "UNKNOWN" }]),
    "UNKNOWN",
  );
  assert.equal(getOverallPublicStatus([{ currentStatus: "UP" }]), "OPERATIONAL");
});
