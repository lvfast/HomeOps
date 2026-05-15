const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");

const { runHealthCheck } = require("../src/healthChecks/runHealthCheck");

test("runHealthCheck returns failure when the request times out", async () => {
  const testServer = await startTestHttpServer((req, res) => {
    setTimeout(() => {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "ok" }));
    }, 1500);
  });

  try {
    const result = await runHealthCheck({
      url: `${testServer.url}/slow-health`,
      expectedStatusCode: 200,
      timeoutSeconds: 1,
    });

    assert.equal(result.status, "FAILURE");
    assert.equal(result.statusCode, null);
    assert.equal(result.errorMessage, "Health check timed out");
    assert.equal(Number.isInteger(result.responseTimeMs), true);
  } finally {
    await testServer.close();
  }
});

async function startTestHttpServer(handler) {
  const server = http.createServer(handler);

  await new Promise((resolve) => {
    server.listen(0, "127.0.0.1", resolve);
  });

  const address = server.address();

  return {
    url: `http://127.0.0.1:${address.port}`,
    close: () =>
      new Promise((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      }),
  };
}
