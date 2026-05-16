const test = require("node:test");
const assert = require("node:assert/strict");

const {
  acknowledgeIncident,
  applyIncidentLifecycle,
  calculateDurationSeconds,
  resolveIncident,
} = require("../src/services/incidentLifecycle");

test("calculateDurationSeconds returns whole seconds between start and resolve", () => {
  assert.equal(
    calculateDurationSeconds(
      new Date("2026-05-16T12:00:00.000Z"),
      new Date("2026-05-16T12:01:05.900Z"),
    ),
    65,
  );
});

test("applyIncidentLifecycle opens an incident when a service becomes DOWN", async () => {
  const createdIncidents = [];
  const createdEvents = [];
  const prisma = {
    incident: {
      findFirst: async () => null,
      create: async (args) => {
        createdIncidents.push(args);
        return {
          id: "incident-1",
          ...args.data,
        };
      },
    },
    incidentEvent: {
      create: async (args) => {
        createdEvents.push(args);
        return {
          id: "event-1",
          ...args.data,
        };
      },
    },
  };
  const checkedAt = new Date("2026-05-16T12:00:00.000Z");

  const incident = await applyIncidentLifecycle(prisma, {
    service: {
      id: "service-1",
      name: "Example API",
      currentStatus: "UP",
    },
    updatedService: {
      id: "service-1",
      currentStatus: "DOWN",
    },
    checkedAt,
  });

  assert.equal(incident.id, "incident-1");
  assert.deepEqual(createdIncidents, [
    {
      data: {
        serviceId: "service-1",
        title: "Example API is down",
        severity: "SEV2",
        status: "OPEN",
        startedAt: checkedAt,
      },
    },
  ]);
  assert.deepEqual(createdEvents, [
    {
      data: {
        incidentId: "incident-1",
        type: "CREATED",
        message: "Incident opened because service became DOWN",
      },
    },
  ]);
});

test("applyIncidentLifecycle does not open a duplicate active incident", async () => {
  const existingIncident = {
    id: "incident-1",
    serviceId: "service-1",
    status: "OPEN",
  };
  const prisma = {
    incident: {
      findFirst: async () => existingIncident,
      create: async () => {
        throw new Error("should not create duplicate incident");
      },
    },
    incidentEvent: {
      create: async () => {
        throw new Error("should not create duplicate event");
      },
    },
  };

  const incident = await applyIncidentLifecycle(prisma, {
    service: {
      id: "service-1",
      name: "Example API",
      currentStatus: "UP",
    },
    updatedService: {
      id: "service-1",
      currentStatus: "DOWN",
    },
    checkedAt: new Date("2026-05-16T12:00:00.000Z"),
  });

  assert.equal(incident, existingIncident);
});

test("applyIncidentLifecycle resolves an active incident when a service recovers", async () => {
  const incident = {
    id: "incident-1",
    serviceId: "service-1",
    status: "OPEN",
    startedAt: new Date("2026-05-16T12:00:00.000Z"),
  };
  const updatedIncidents = [];
  const createdEvents = [];
  const resolvedAt = new Date("2026-05-16T12:05:00.000Z");
  const prisma = {
    incident: {
      findFirst: async () => incident,
      update: async (args) => {
        updatedIncidents.push(args);
        return {
          ...incident,
          ...args.data,
        };
      },
    },
    incidentEvent: {
      create: async (args) => {
        createdEvents.push(args);
        return {
          id: "event-1",
          ...args.data,
        };
      },
    },
  };

  const resolvedIncident = await applyIncidentLifecycle(prisma, {
    service: {
      id: "service-1",
      currentStatus: "DOWN",
    },
    updatedService: {
      id: "service-1",
      currentStatus: "UP",
    },
    checkedAt: resolvedAt,
  });

  assert.equal(resolvedIncident.status, "RESOLVED");
  assert.deepEqual(updatedIncidents, [
    {
      where: { id: "incident-1" },
      data: {
        status: "RESOLVED",
        resolvedAt,
        durationSeconds: 300,
      },
    },
  ]);
  assert.deepEqual(createdEvents, [
    {
      data: {
        incidentId: "incident-1",
        type: "RESOLVED",
        message: "Incident resolved because service recovered",
        createdAt: resolvedAt,
      },
    },
  ]);
});

test("acknowledgeIncident rejects resolved incidents", async () => {
  const result = await acknowledgeIncident(
    {},
    {
      id: "incident-1",
      status: "RESOLVED",
    },
  );

  assert.deepEqual(result, {
    ok: false,
    message: "Resolved incidents cannot be acknowledged",
  });
});

test("resolveIncident rejects incidents that are already resolved", async () => {
  const result = await resolveIncident(
    {},
    {
      id: "incident-1",
      status: "RESOLVED",
    },
  );

  assert.deepEqual(result, {
    ok: false,
    message: "Incident is already resolved",
  });
});
