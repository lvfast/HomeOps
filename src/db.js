const { PrismaClient } = require("@prisma/client");
const { config } = require("./config");

function createPrismaClient(databaseUrl = config.databaseUrl) {
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required to create a Prisma client");
  }

  process.env.DATABASE_URL = databaseUrl;

  return new PrismaClient();
}

module.exports = {
  createPrismaClient,
};
