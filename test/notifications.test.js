const test = require("node:test");
const assert = require("node:assert/strict");

const {
  buildDiscordMessage,
  getNotificationEventType,
  sendIncidentNotification,
} = require("../src/services/notifications");

test("getNotificationEventType maps lifecycle actions to incident event types", () => {
  assert.equal(getNotificationEventType("OPENED"), "CREATED");
  assert.equal(getNotificationEventType("RESOLVED"), "RESOLVED");
  assert.equal(getNotificationEventType("UNKNOWN"), null);
});

test("buildDiscordMessage creates an opened incident message", () => {
  assert.deepEqual(
    buildDiscordMessage({
      action: "OPENED",
      incident: { title: "Example API is down" },
    }),
    {
      content: "Incident opened: Example API is down",
    },
  );
});

test("sendIncidentNotification records SKIPPED when Discord webhook is not configured", async () => {
  const createdNotifications = [];
  const prisma = createNotificationPrismaMock({
    onCreate: (args) => createdNotifications.push(args),
  });

  const notification = await sendIncidentNotification(prisma, {
    action: "OPENED",
    incident: { id: "incident-1", title: "Example API is down" },
    webhookUrl: "",
  });

  assert.equal(notification.status, "SKIPPED");
  assert.deepEqual(createdNotifications, [
    {
      data: {
        incidentId: "incident-1",
        channel: "DISCORD",
        eventType: "CREATED",
        status: "SKIPPED",
        errorMessage: "DISCORD_WEBHOOK_URL is not configured",
        sentAt: null,
      },
    },
  ]);
});

test("sendIncidentNotification sends Discord webhook and records SENT", async () => {
  const fetchCalls = [];
  const createdNotifications = [];
  const sentAt = new Date("2026-05-18T10:00:00.000Z");
  const prisma = createNotificationPrismaMock({
    onCreate: (args) => createdNotifications.push(args),
  });

  const notification = await sendIncidentNotification(prisma, {
    action: "RESOLVED",
    incident: { id: "incident-1", title: "Example API is down" },
    webhookUrl: "https://discord.example/webhook",
    fetchFn: async (...args) => {
      fetchCalls.push(args);
      return { ok: true, status: 204 };
    },
    now: sentAt,
  });

  assert.equal(notification.status, "SENT");
  assert.equal(fetchCalls.length, 1);
  assert.deepEqual(fetchCalls[0], [
    "https://discord.example/webhook",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: "Incident resolved: Example API is down",
      }),
    },
  ]);
  assert.deepEqual(createdNotifications, [
    {
      data: {
        incidentId: "incident-1",
        channel: "DISCORD",
        eventType: "RESOLVED",
        status: "SENT",
        errorMessage: null,
        sentAt,
      },
    },
  ]);
});

test("sendIncidentNotification does not resend already sent notifications", async () => {
  const existingNotification = {
    id: "notification-1",
    status: "SENT",
  };
  const prisma = createNotificationPrismaMock({
    existingNotification,
    onCreate: () => {
      throw new Error("should not create duplicate notification");
    },
  });

  const notification = await sendIncidentNotification(prisma, {
    action: "OPENED",
    incident: { id: "incident-1", title: "Example API is down" },
    webhookUrl: "https://discord.example/webhook",
    fetchFn: async () => {
      throw new Error("should not call webhook twice");
    },
  });

  assert.equal(notification, existingNotification);
});

test("sendIncidentNotification records FAILED when Discord webhook fails", async () => {
  const createdNotifications = [];
  const prisma = createNotificationPrismaMock({
    onCreate: (args) => createdNotifications.push(args),
  });

  const notification = await sendIncidentNotification(prisma, {
    action: "OPENED",
    incident: { id: "incident-1", title: "Example API is down" },
    webhookUrl: "https://discord.example/webhook",
    fetchFn: async () => ({ ok: false, status: 500 }),
  });

  assert.equal(notification.status, "FAILED");
  assert.deepEqual(createdNotifications[0].data, {
    incidentId: "incident-1",
    channel: "DISCORD",
    eventType: "CREATED",
    status: "FAILED",
    errorMessage: "Discord webhook returned 500",
    sentAt: null,
  });
});

function createNotificationPrismaMock({
  existingNotification = null,
  onCreate = () => {},
  onUpdate = () => {},
} = {}) {
  return {
    notification: {
      findFirst: async () => existingNotification,
      create: async (args) => {
        onCreate(args);
        return {
          id: "notification-1",
          ...args.data,
        };
      },
      update: async (args) => {
        onUpdate(args);
        return {
          id: args.where.id,
          ...args.data,
        };
      },
    },
  };
}
