const express = require("express");
const {
  getOverallPublicStatus,
  mapPublicServiceStatus,
} = require("../services/metrics");

function createPublicStatusRoutes(prisma) {
  const router = express.Router();

  router.get("/status", async (req, res) => {
    const services = await prisma.service.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });

    res.status(200).json({
      status: getOverallPublicStatus(services),
      services: services.map((service) => ({
        id: service.id,
        name: service.name,
        status: mapPublicServiceStatus(service.currentStatus),
        lastCheckedAt: service.lastCheckedAt,
      })),
    });
  });

  return router;
}

module.exports = {
  createPublicStatusRoutes,
};
