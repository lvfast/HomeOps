require("dotenv").config({ quiet: true });

function parsePort(value, fallback) {
  const port = Number(value);

  if (!Number.isInteger(port) || port <= 0) {
    return fallback;
  }

  return port;
}

function parsePositiveInteger(value, fallback) {
  const number = Number(value);

  if (!Number.isInteger(number) || number <= 0) {
    return fallback;
  }

  return number;
}

const config = {
  appPort: parsePort(process.env.APP_PORT, 3000),
  nodeEnv: process.env.NODE_ENV || "development",
  databaseUrl: process.env.DATABASE_URL,
  redisUrl: process.env.REDIS_URL,
  workerPollIntervalSeconds: parsePositiveInteger(
    process.env.WORKER_POLL_INTERVAL_SECONDS,
    5,
  ),
};

module.exports = {
  config,
  parsePort,
  parsePositiveInteger,
};
