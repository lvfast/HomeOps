const activeIncidentStatuses = ["OPEN", "ACKNOWLEDGED"];

function buildIncidentTitle(service) {
  return `${service.name} is down`;
}

function calculateDurationSeconds(startedAt, resolvedAt) {
  const durationMs =
    new Date(resolvedAt).getTime() - new Date(startedAt).getTime();

  return Math.max(0, Math.floor(durationMs / 1000));
}

async function applyIncidentLifecycle(
  prisma,
  { service, updatedService, checkedAt },
) {
  if (
    service.currentStatus !== "DOWN" &&
    updatedService.currentStatus === "DOWN"
  ) {
    const incident = await openIncidentIfNeeded(prisma, service, checkedAt);

    return incident ? { action: "OPENED", incident } : null;
  }

  if (service.currentStatus === "DOWN" && updatedService.currentStatus === "UP") {
    const incident = await resolveActiveIncidentIfNeeded(
      prisma,
      service.id,
      checkedAt,
    );

    return incident ? { action: "RESOLVED", incident } : null;
  }

  return null;
}

async function openIncidentIfNeeded(prisma, service, startedAt) {
  const existingIncident = await findActiveIncidentForService(prisma, service.id);

  if (existingIncident) {
    return existingIncident;
  }

  const incident = await prisma.incident.create({
    data: {
      serviceId: service.id,
      title: buildIncidentTitle(service),
      severity: "SEV2",
      status: "OPEN",
      startedAt,
    },
  });

  await prisma.incidentEvent.create({
    data: {
      incidentId: incident.id,
      type: "CREATED",
      message: "Incident opened because service became DOWN",
    },
  });

  return incident;
}

async function resolveActiveIncidentIfNeeded(prisma, serviceId, resolvedAt) {
  const incident = await findActiveIncidentForService(prisma, serviceId);

  if (!incident) {
    return null;
  }

  const result = await resolveIncident(prisma, incident, resolvedAt, {
    message: "Incident resolved because service recovered",
  });

  return result.ok ? result.incident : null;
}

async function acknowledgeIncident(prisma, incident, acknowledgedAt = new Date()) {
  if (incident.status === "RESOLVED") {
    return {
      ok: false,
      message: "Resolved incidents cannot be acknowledged",
    };
  }

  if (incident.status === "ACKNOWLEDGED") {
    return {
      ok: true,
      incident,
    };
  }

  const updatedIncident = await prisma.incident.update({
    where: { id: incident.id },
    data: { status: "ACKNOWLEDGED" },
  });

  await prisma.incidentEvent.create({
    data: {
      incidentId: incident.id,
      type: "ACKNOWLEDGED",
      message: "Incident acknowledged",
      createdAt: acknowledgedAt,
    },
  });

  return {
    ok: true,
    incident: updatedIncident,
  };
}

async function resolveIncident(prisma, incident, resolvedAt = new Date(), options = {}) {
  if (incident.status === "RESOLVED") {
    return {
      ok: false,
      message: "Incident is already resolved",
    };
  }

  const durationSeconds = calculateDurationSeconds(incident.startedAt, resolvedAt);
  const updatedIncident = await prisma.incident.update({
    where: { id: incident.id },
    data: {
      status: "RESOLVED",
      resolvedAt,
      durationSeconds,
    },
  });

  await prisma.incidentEvent.create({
    data: {
      incidentId: incident.id,
      type: "RESOLVED",
      message: options.message || "Incident resolved",
      createdAt: resolvedAt,
    },
  });

  return {
    ok: true,
    incident: updatedIncident,
  };
}

async function findActiveIncidentForService(prisma, serviceId) {
  return prisma.incident.findFirst({
    where: {
      serviceId,
      status: { in: activeIncidentStatuses },
    },
    orderBy: { startedAt: "desc" },
  });
}

module.exports = {
  acknowledgeIncident,
  applyIncidentLifecycle,
  calculateDurationSeconds,
  findActiveIncidentForService,
  resolveIncident,
};
