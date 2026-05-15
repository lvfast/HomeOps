const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

const { createApp } = require("../src/app");
const { createPrismaClient } = require("../src/db");

const prisma = createPrismaClient();
const app = createApp({ prisma });
const createdServiceIds = [];

test.after(async () => {
  if (createdServiceIds.length > 0) {
    await prisma.service.deleteMany({
      where: {
        id: {
          in: createdServiceIds,
        },
      },
    });
  }

  await prisma.$disconnect();
});

test("service management flow creates, reads, updates, pauses, resumes, and deletes a service", async () => {
  const createResponse = await request(app).post("/services").send({
    name: "Example API",
    url: "https://example.com/health",
    expectedStatusCode: 200,
    intervalSeconds: 60,
    timeoutSeconds: 5,
    failureThreshold: 3,
  });

  assert.equal(createResponse.status, 201);
  assert.equal(createResponse.body.service.name, "Example API");
  assert.equal(createResponse.body.service.url, "https://example.com/health");
  assert.equal(createResponse.body.service.currentStatus, "UNKNOWN");
  assert.equal(createResponse.body.service.isActive, true);

  const serviceId = createResponse.body.service.id;
  createdServiceIds.push(serviceId);

  const listResponse = await request(app).get("/services");

  assert.equal(listResponse.status, 200);
  assert.equal(
    listResponse.body.services.some((service) => service.id === serviceId),
    true,
  );

  const getResponse = await request(app).get(`/services/${serviceId}`);

  assert.equal(getResponse.status, 200);
  assert.equal(getResponse.body.service.id, serviceId);

  const updateResponse = await request(app).patch(`/services/${serviceId}`).send({
    name: "Updated API",
    intervalSeconds: 30,
  });

  assert.equal(updateResponse.status, 200);
  assert.equal(updateResponse.body.service.name, "Updated API");
  assert.equal(updateResponse.body.service.intervalSeconds, 30);

  const pauseResponse = await request(app).post(`/services/${serviceId}/pause`);

  assert.equal(pauseResponse.status, 200);
  assert.equal(pauseResponse.body.service.isActive, false);

  const resumeResponse = await request(app).post(`/services/${serviceId}/resume`);

  assert.equal(resumeResponse.status, 200);
  assert.equal(resumeResponse.body.service.isActive, true);

  const deleteResponse = await request(app).delete(`/services/${serviceId}`);

  assert.equal(deleteResponse.status, 204);

  const getDeletedResponse = await request(app).get(`/services/${serviceId}`);

  assert.equal(getDeletedResponse.status, 404);
  assert.deepEqual(getDeletedResponse.body, {
    error: "Not Found",
    message: "Service not found",
  });
});

test("POST /services rejects an invalid URL", async () => {
  const response = await request(app).post("/services").send({
    name: "Invalid API",
    url: "not-a-url",
  });

  assert.equal(response.status, 400);
  assert.deepEqual(response.body, {
    error: "Bad Request",
    message: "Service URL must be a valid HTTP or HTTPS URL",
  });
});
