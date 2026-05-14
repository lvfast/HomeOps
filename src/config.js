require("dotenv").config({ quiet: true });

function parsePort(value, fallback) {
  const port = Number(value);

  if (!Number.isInteger(port) || port <= 0) {
    return fallback;
  }

  return port;
}

const config = {
  appPort: parsePort(process.env.APP_PORT, 3000),
  nodeEnv: process.env.NODE_ENV || "development",
  databaseUrl: process.env.DATABASE_URL,
  redisUrl: process.env.REDIS_URL,
};

module.exports = {
  config,
  parsePort,
};
