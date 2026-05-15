async function runHealthCheck(service) {
  const startedAt = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    service.timeoutSeconds * 1000,
  );

  try {
    const response = await fetch(service.url, {
      method: "GET",
      signal: controller.signal,
    });
    const responseTimeMs = Date.now() - startedAt;

    if (response.status === service.expectedStatusCode) {
      return {
        status: "SUCCESS",
        statusCode: response.status,
        responseTimeMs,
        errorMessage: null,
      };
    }

    return {
      status: "FAILURE",
      statusCode: response.status,
      responseTimeMs,
      errorMessage: `Expected status ${service.expectedStatusCode} but received ${response.status}`,
    };
  } catch (error) {
    return {
      status: "FAILURE",
      statusCode: null,
      responseTimeMs: Date.now() - startedAt,
      errorMessage: getHealthCheckErrorMessage(error),
    };
  } finally {
    clearTimeout(timeout);
  }
}

function getHealthCheckErrorMessage(error) {
  if (error.name === "AbortError") {
    return "Health check timed out";
  }

  return error.message || "Health check failed";
}

module.exports = {
  runHealthCheck,
};
