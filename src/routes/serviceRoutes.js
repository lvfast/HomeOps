const express = require("express");
const { checkService } = require("../services/checkService");
const {
  calculateHealthCheckMetrics,
  parseMetricsRange,
} = require("../services/metrics");

const editableFields = [
  "name",
  "url",
  "expectedStatusCode",
  "intervalSeconds",
  "timeoutSeconds",
  "failureThreshold",
];

function createServiceRoutes(prisma) {
  const router = express.Router();

  router.get("/services", async (req, res) => {
    const services = await prisma.service.findMany({
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json({ services });
  });

  router.post("/services", async (req, res) => {
    const validation = validateServicePayload(req.body, { requireAll: true });

    if (!validation.ok) {
      return res.status(400).json({
        error: "Bad Request",
        message: validation.message,
      });
    }

    const service = await prisma.service.create({
      data: validation.data,
    });

    res.status(201).json({ service });
  });

  router.get("/services/:id", async (req, res) => {
    const service = await findService(prisma, req.params.id);

    if (!service) {
      return sendServiceNotFound(res);
    }

    res.status(200).json({ service });
  });

  router.get("/services/:id/metrics", async (req, res) => {
    const service = await findService(prisma, req.params.id);

    if (!service) {
      return sendServiceNotFound(res);
    }

    const range = parseMetricsRange(req.query.range);

    if (!range.ok) {
      return res.status(400).json({
        error: "Bad Request",
        message: range.message,
      });
    }

    const healthChecks = await prisma.healthCheck.findMany({
      where: {
        serviceId: service.id,
        checkedAt: {
          gte: range.startedAt,
        },
      },
    });

    res.status(200).json({
      service: {
        id: service.id,
        name: service.name,
        currentStatus: service.currentStatus,
      },
      range: range.range,
      metrics: calculateHealthCheckMetrics(healthChecks),
    });
  });

  router.post("/services/:id/check", async (req, res) => {
    const service = await findService(prisma, req.params.id);

    if (!service) {
      return sendServiceNotFound(res);
    }

    const checkResult = await checkService(prisma, service);

    res.status(201).json(checkResult);
  });

  router.get("/services/:id/health-checks", async (req, res) => {
    const service = await findService(prisma, req.params.id);

    if (!service) {
      return sendServiceNotFound(res);
    }

    const healthChecks = await prisma.healthCheck.findMany({
      where: { serviceId: service.id },
      orderBy: { checkedAt: "desc" },
    });

    res.status(200).json({ healthChecks });
  });

  router.patch("/services/:id", async (req, res) => {
    const existingService = await findService(prisma, req.params.id);

    if (!existingService) {
      return sendServiceNotFound(res);
    }

    const validation = validateServicePayload(req.body, { requireAll: false });

    if (!validation.ok) {
      return res.status(400).json({
        error: "Bad Request",
        message: validation.message,
      });
    }

    const service = await prisma.service.update({
      where: { id: req.params.id },
      data: validation.data,
    });

    res.status(200).json({ service });
  });

  router.delete("/services/:id", async (req, res) => {
    const existingService = await findService(prisma, req.params.id);

    if (!existingService) {
      return sendServiceNotFound(res);
    }

    await prisma.service.delete({
      where: { id: req.params.id },
    });

    res.status(204).send();
  });

  router.post("/services/:id/pause", async (req, res) => {
    const service = await updateServiceActiveState(prisma, req.params.id, false);

    if (!service) {
      return sendServiceNotFound(res);
    }

    res.status(200).json({ service });
  });

  router.post("/services/:id/resume", async (req, res) => {
    const service = await updateServiceActiveState(prisma, req.params.id, true);

    if (!service) {
      return sendServiceNotFound(res);
    }

    res.status(200).json({ service });
  });

  return router;
}

async function findService(prisma, id) {
  return prisma.service.findUnique({
    where: { id },
  });
}

async function updateServiceActiveState(prisma, id, isActive) {
  const existingService = await findService(prisma, id);

  if (!existingService) {
    return null;
  }

  return prisma.service.update({
    where: { id },
    data: { isActive },
  });
}

function sendServiceNotFound(res) {
  return res.status(404).json({
    error: "Not Found",
    message: "Service not found",
  });
}

function validateServicePayload(payload, { requireAll }) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return invalid("Request body must be an object");
  }

  const data = {};

  for (const field of editableFields) {
    if (Object.prototype.hasOwnProperty.call(payload, field)) {
      data[field] = payload[field];
    }
  }

  if (!requireAll && Object.keys(data).length === 0) {
    return invalid("At least one editable field is required");
  }

  if (requireAll && !hasNonEmptyString(data.name)) {
    return invalid("Service name is required");
  }

  if (Object.prototype.hasOwnProperty.call(data, "name")) {
    if (!hasNonEmptyString(data.name)) {
      return invalid("Service name must be a non-empty string");
    }

    data.name = data.name.trim();
  }

  if (requireAll && !hasNonEmptyString(data.url)) {
    return invalid("Service URL is required");
  }

  if (Object.prototype.hasOwnProperty.call(data, "url")) {
    if (!isHttpUrl(data.url)) {
      return invalid("Service URL must be a valid HTTP or HTTPS URL");
    }
  }

  const numericFields = [
    ["expectedStatusCode", 100, 599],
    ["intervalSeconds", 1, Number.MAX_SAFE_INTEGER],
    ["timeoutSeconds", 1, Number.MAX_SAFE_INTEGER],
    ["failureThreshold", 1, Number.MAX_SAFE_INTEGER],
  ];

  for (const [field, min, max] of numericFields) {
    if (Object.prototype.hasOwnProperty.call(data, field)) {
      if (!isIntegerInRange(data[field], min, max)) {
        return invalid(`${field} must be an integer between ${min} and ${max}`);
      }
    }
  }

  return {
    ok: true,
    data,
  };
}

function invalid(message) {
  return {
    ok: false,
    message,
  };
}

function hasNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isHttpUrl(value) {
  if (!hasNonEmptyString(value)) {
    return false;
  }

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function isIntegerInRange(value, min, max) {
  return Number.isInteger(value) && value >= min && value <= max;
}

module.exports = {
  createServiceRoutes,
  validateServicePayload,
};
