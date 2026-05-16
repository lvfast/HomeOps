const express = require("express");
const {
  acknowledgeIncident,
  resolveIncident,
} = require("../services/incidentLifecycle");

function createIncidentRoutes(prisma) {
  const router = express.Router();

  router.get("/incidents", async (req, res) => {
    const incidents = await prisma.incident.findMany({
      orderBy: { startedAt: "desc" },
    });

    res.status(200).json({ incidents });
  });

  router.get("/incidents/:id", async (req, res) => {
    const incident = await findIncident(prisma, req.params.id);

    if (!incident) {
      return sendIncidentNotFound(res);
    }

    res.status(200).json({ incident });
  });

  router.post("/incidents/:id/acknowledge", async (req, res) => {
    const incident = await findIncident(prisma, req.params.id);

    if (!incident) {
      return sendIncidentNotFound(res);
    }

    const result = await acknowledgeIncident(prisma, incident);

    if (!result.ok) {
      return res.status(400).json({
        error: "Bad Request",
        message: result.message,
      });
    }

    res.status(200).json({ incident: result.incident });
  });

  router.post("/incidents/:id/resolve", async (req, res) => {
    const incident = await findIncident(prisma, req.params.id);

    if (!incident) {
      return sendIncidentNotFound(res);
    }

    const result = await resolveIncident(prisma, incident);

    if (!result.ok) {
      return res.status(400).json({
        error: "Bad Request",
        message: result.message,
      });
    }

    res.status(200).json({ incident: result.incident });
  });

  router.get("/incidents/:id/events", async (req, res) => {
    const incident = await findIncident(prisma, req.params.id);

    if (!incident) {
      return sendIncidentNotFound(res);
    }

    const events = await prisma.incidentEvent.findMany({
      where: { incidentId: incident.id },
      orderBy: { createdAt: "asc" },
    });

    res.status(200).json({ events });
  });

  return router;
}

async function findIncident(prisma, id) {
  return prisma.incident.findUnique({
    where: { id },
  });
}

function sendIncidentNotFound(res) {
  return res.status(404).json({
    error: "Not Found",
    message: "Incident not found",
  });
}

module.exports = {
  createIncidentRoutes,
};
