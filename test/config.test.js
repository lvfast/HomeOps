const test = require("node:test");
const assert = require("node:assert/strict");

const { parsePort } = require("../src/config");

test("parsePort returns a valid numeric port", () => {
  assert.equal(parsePort("4000", 3000), 4000);
});

test("parsePort returns fallback when port is missing", () => {
  assert.equal(parsePort(undefined, 3000), 3000);
});

test("parsePort returns fallback when port is invalid", () => {
  assert.equal(parsePort("not-a-port", 3000), 3000);
});
