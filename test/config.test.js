const test = require("node:test");
const assert = require("node:assert/strict");

const { parsePort, parsePositiveInteger } = require("../src/config");

test("parsePort returns a valid numeric port", () => {
  assert.equal(parsePort("4000", 3000), 4000);
});

test("parsePort returns fallback when port is missing", () => {
  assert.equal(parsePort(undefined, 3000), 3000);
});

test("parsePort returns fallback when port is invalid", () => {
  assert.equal(parsePort("not-a-port", 3000), 3000);
});

test("parsePositiveInteger returns a valid positive integer", () => {
  assert.equal(parsePositiveInteger("5", 1), 5);
});

test("parsePositiveInteger returns fallback when value is invalid", () => {
  assert.equal(parsePositiveInteger("0", 5), 5);
  assert.equal(parsePositiveInteger("not-a-number", 5), 5);
});
