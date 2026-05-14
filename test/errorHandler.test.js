const express = require("express");
const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

const app = require("../src/app");
const errorHandler = require("../src/middleware/errorHandler");

test("error handler returns JSON 500", async () => {
  const app = express();

  app.get("/error", () => {
    throw new Error("Test error");
  });

  app.use(errorHandler);

  const response = await request(app).get("/error");

  assert.equal(response.status, 500);
  assert.deepEqual(response.body, {
    error: "Internal Server Error",
    message: "Something went wrong",
  });
});

test("app returns JSON 400 for invalid JSON body", async () => {
  const response = await request(app)
    .post("/health")
    .set("Content-Type", "application/json")
    .send("{ invalid json");

  assert.equal(response.status, 400);
  assert.deepEqual(response.body, {
    error: "Bad Request",
    message: "Invalid JSON request body",
  });
});
