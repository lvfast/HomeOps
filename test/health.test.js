const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

const app = require("../src/app");

test("GET /health returns ok status", async () => {
  const response = await request(app).get("/health");

  assert.equal(response.status, 200);
  assert.deepEqual(response.body, { status: "ok" });
});
