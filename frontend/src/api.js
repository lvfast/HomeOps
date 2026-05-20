async function fetchJson(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      Accept: "application/json",
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = data?.message || `Request failed with HTTP ${response.status}`;
    throw new Error(message);
  }

  return data;
}

export function getDashboardSummary() {
  return fetchJson("/dashboard/summary");
}

export function getServices() {
  return fetchJson("/services");
}

export function getService(id) {
  return fetchJson(`/services/${id}`);
}

export function getServiceHealthChecks(id) {
  return fetchJson(`/services/${id}/health-checks`);
}

export function getServiceMetrics(id, range = "24h") {
  return fetchJson(`/services/${id}/metrics?range=${range}`);
}

export function runServiceCheck(id) {
  return fetchJson(`/services/${id}/check`, {
    method: "POST",
  });
}

export function pauseService(id) {
  return fetchJson(`/services/${id}/pause`, {
    method: "POST",
  });
}

export function resumeService(id) {
  return fetchJson(`/services/${id}/resume`, {
    method: "POST",
  });
}

export function getPublicStatus() {
  return fetchJson("/status");
}
