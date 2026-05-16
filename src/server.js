const app = require("./app");
const { config } = require("./config");
const { createHealthCheckScheduler } = require("./workers/healthCheckScheduler");

const scheduler = createHealthCheckScheduler({
  prisma: app.locals.prisma,
  pollIntervalSeconds: config.workerPollIntervalSeconds,
});

app.listen(config.appPort, () => {
  console.log(`HomeOps API is running on http://localhost:${config.appPort}`);
  scheduler.start();
  console.log(
    `Health check worker is polling every ${config.workerPollIntervalSeconds} seconds`,
  );
});
