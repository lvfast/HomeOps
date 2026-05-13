const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

const app = require("../src/app");

test("GET / returns API status", async () => {
  const response = await request(app).get("/");

  assert.equal(response.status, 200);
  assert.deepEqual(response.body, {
    name: "HomeOps API",
    status: "running",
  });
});

test("GET /health returns ok status", async () => {
  const response = await request(app).get("/health");

  assert.equal(response.status, 200);
  assert.deepEqual(response.body, { status: "ok" });
});

test("GET /ready returns ready status", async () => {
  const response = await request(app).get("/ready");

  assert.equal(response.status, 200);
  assert.deepEqual(response.body, { status: "ready" });
});

test("unknown route returns JSON 404", async () => {
  const response = await request(app).get("/unknown-route");

  assert.equal(response.status, 404);
  assert.deepEqual(response.body, {
    error: "Not Found",
    message: "Route not found",
  });
});
