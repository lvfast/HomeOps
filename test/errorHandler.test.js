const express = require("express");
const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

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
