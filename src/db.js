const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { config } = require("./config");

function createPrismaClient(databaseUrl = config.databaseUrl) {
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required to create a Prisma client");
  }

  const adapter = new PrismaPg({ connectionString: databaseUrl });

  return new PrismaClient({ adapter });
}

module.exports = {
  createPrismaClient,
};
