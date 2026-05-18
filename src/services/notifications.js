const { config } = require("../config");

const discordChannel = "DISCORD";

function getNotificationEventType(action) {
  if (action === "OPENED") {
    return "CREATED";
  }

  if (action === "RESOLVED") {
    return "RESOLVED";
  }

  return null;
}

function buildDiscordMessage({ incident, action }) {
  if (action === "OPENED") {
    return {
      content: `Incident opened: ${incident.title}`,
    };
  }

  return {
    content: `Incident resolved: ${incident.title}`,
  };
}

async function sendIncidentNotification(
  prisma,
  {
    incident,
    action,
    webhookUrl = config.discordWebhookUrl,
    fetchFn = fetch,
    now = new Date(),
  },
) {
  const eventType = getNotificationEventType(action);

  if (!eventType) {
    return null;
  }

  const existingNotification = await findIncidentNotification(prisma, {
    incidentId: incident.id,
    eventType,
    channel: discordChannel,
  });

  if (existingNotification?.status === "SENT") {
    return existingNotification;
  }

  if (!webhookUrl) {
    return upsertNotification(prisma, {
      existingNotification,
      incidentId: incident.id,
      eventType,
      status: "SKIPPED",
      errorMessage: "DISCORD_WEBHOOK_URL is not configured",
      sentAt: null,
    });
  }

  try {
    const response = await fetchFn(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildDiscordMessage({ incident, action })),
    });

    if (!response.ok) {
      throw new Error(`Discord webhook returned ${response.status}`);
    }

    return upsertNotification(prisma, {
      existingNotification,
      incidentId: incident.id,
      eventType,
      status: "SENT",
      errorMessage: null,
      sentAt: now,
    });
  } catch (error) {
    return upsertNotification(prisma, {
      existingNotification,
      incidentId: incident.id,
      eventType,
      status: "FAILED",
      errorMessage: error.message || "Discord notification failed",
      sentAt: null,
    });
  }
}

async function findIncidentNotification(prisma, { incidentId, eventType, channel }) {
  return prisma.notification.findFirst({
    where: {
      incidentId,
      eventType,
      channel,
    },
  });
}

async function upsertNotification(
  prisma,
  { existingNotification, incidentId, eventType, status, errorMessage, sentAt },
) {
  const data = {
    incidentId,
    channel: discordChannel,
    eventType,
    status,
    errorMessage,
    sentAt,
  };

  if (existingNotification) {
    return prisma.notification.update({
      where: { id: existingNotification.id },
      data,
    });
  }

  return prisma.notification.create({
    data,
  });
}

module.exports = {
  buildDiscordMessage,
  getNotificationEventType,
  sendIncidentNotification,
};
