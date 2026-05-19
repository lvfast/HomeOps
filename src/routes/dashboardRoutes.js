const express = require("express");

function createDashboardRoutes(prisma) {
  const router = express.Router();

  router.get("/dashboard/summary", async (req, res) => {
    const [
      totalServices,
      activeServices,
      upServices,
      downServices,
      unknownServices,
      openIncidents,
      acknowledgedIncidents,
      resolvedIncidents,
      recentIncidents,
    ] = await Promise.all([
      prisma.service.count(),
      prisma.service.count({ where: { isActive: true } }),
      prisma.service.count({ where: { currentStatus: "UP" } }),
      prisma.service.count({ where: { currentStatus: "DOWN" } }),
      prisma.service.count({ where: { currentStatus: "UNKNOWN" } }),
      prisma.incident.count({ where: { status: "OPEN" } }),
      prisma.incident.count({ where: { status: "ACKNOWLEDGED" } }),
      prisma.incident.count({ where: { status: "RESOLVED" } }),
      prisma.incident.findMany({
        orderBy: { startedAt: "desc" },
        take: 5,
      }),
    ]);

    res.status(200).json({
      summary: {
        services: {
          total: totalServices,
          active: activeServices,
          up: upServices,
          down: downServices,
          unknown: unknownServices,
        },
        incidents: {
          open: openIncidents,
          acknowledged: acknowledgedIncidents,
          active: openIncidents + acknowledgedIncidents,
          resolved: resolvedIncidents,
        },
        recentIncidents,
      },
    });
  });

  return router;
}

module.exports = {
  createDashboardRoutes,
};
