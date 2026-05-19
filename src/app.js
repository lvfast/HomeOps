const express = require("express");
const { createPrismaClient } = require("./db");
const errorHandler = require("./middleware/errorHandler");
const notFoundHandler = require("./middleware/notFoundHandler");
const { createDashboardRoutes } = require("./routes/dashboardRoutes");
const { createIncidentRoutes } = require("./routes/incidentRoutes");
const { createPublicStatusRoutes } = require("./routes/publicStatusRoutes");
const { createServiceRoutes } = require("./routes/serviceRoutes");
const statusRoutes = require("./routes/statusRoutes");

function createApp({ prisma = createPrismaClient() } = {}) {
  const app = express();

  app.locals.prisma = prisma;
  app.use(express.json());
  app.use(statusRoutes);
  app.use(createDashboardRoutes(prisma));
  app.use(createIncidentRoutes(prisma));
  app.use(createPublicStatusRoutes(prisma));
  app.use(createServiceRoutes(prisma));
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

const app = createApp();

module.exports = app;
module.exports.createApp = createApp;
