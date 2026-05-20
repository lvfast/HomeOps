import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ErrorState from "../components/ErrorState.jsx";
import LoadingState from "../components/LoadingState.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import {
  getService,
  getServiceHealthChecks,
  getServiceMetrics,
  pauseService,
  resumeService,
  runServiceCheck,
} from "../api.js";

function ServiceDetailPage() {
  const { id } = useParams();
  const [state, setState] = useState({
    status: "loading",
    service: null,
    metrics: null,
    healthChecks: [],
    error: null,
  });
  const [actionState, setActionState] = useState({
    status: "idle",
    message: null,
  });

  useEffect(() => {
    let ignore = false;

    loadService(id, setState, () => ignore);

    return () => {
      ignore = true;
    };
  }, [id]);

  async function handleRunCheck() {
    await runServiceAction({
      action: () => runServiceCheck(id),
      successMessage: "Health check completed.",
      id,
      setActionState,
      setState,
    });
  }

  async function handleToggleActive() {
    const isActive = state.service.isActive;

    await runServiceAction({
      action: () => (isActive ? pauseService(id) : resumeService(id)),
      successMessage: isActive ? "Service paused." : "Service resumed.",
      id,
      setActionState,
      setState,
    });
  }

  if (state.status === "loading") {
    return <LoadingState label="Loading service..." />;
  }

  if (state.status === "error") {
    return <ErrorState title="Service could not load" message={state.error} />;
  }

  return (
    <div className="page-stack">
      <Link className="text-link" to="/">
        Back to dashboard
      </Link>

      <section className="page-heading">
        <div>
          <p className="eyebrow">Service detail</p>
          <h1>{state.service.name}</h1>
        </div>
        <div className="heading-actions">
          <StatusBadge status={state.service.currentStatus} />
          <button
            className="button secondary-button"
            disabled={actionState.status === "loading"}
            type="button"
            onClick={handleToggleActive}
          >
            {state.service.isActive ? "Pause" : "Resume"}
          </button>
          <button
            className="button primary-button"
            disabled={actionState.status === "loading"}
            type="button"
            onClick={handleRunCheck}
          >
            Check now
          </button>
        </div>
      </section>

      {actionState.message ? (
        <p
          className={`action-message ${
            actionState.status === "error" ? "action-error" : "action-success"
          }`}
        >
          {actionState.message}
        </p>
      ) : null}

      <section className="panel detail-grid">
        <div>
          <span className="label">URL</span>
          <strong>{state.service.url}</strong>
        </div>
        <div>
          <span className="label">Expected status</span>
          <strong>{state.service.expectedStatusCode}</strong>
        </div>
        <div>
          <span className="label">Check interval</span>
          <strong>{state.service.intervalSeconds}s</strong>
        </div>
        <div>
          <span className="label">Failure threshold</span>
          <strong>{state.service.failureThreshold}</strong>
        </div>
      </section>

      <MetricsPanel metrics={state.metrics} />
      <HealthChecksPanel healthChecks={state.healthChecks} />
    </div>
  );
}

async function loadService(id, setState, shouldIgnore = () => false) {
  try {
    const [serviceResponse, metricsResponse, healthChecksResponse] =
      await Promise.all([
        getService(id),
        getServiceMetrics(id),
        getServiceHealthChecks(id),
      ]);

    if (!shouldIgnore()) {
      setState({
        status: "ready",
        service: serviceResponse.service,
        metrics: metricsResponse.metrics,
        healthChecks: healthChecksResponse.healthChecks.slice(0, 10),
        error: null,
      });
    }
  } catch (error) {
    if (!shouldIgnore()) {
      setState({
        status: "error",
        service: null,
        metrics: null,
        healthChecks: [],
        error: error.message,
      });
    }
  }
}

async function runServiceAction({
  action,
  successMessage,
  id,
  setActionState,
  setState,
}) {
  try {
    setActionState({
      status: "loading",
      message: "Working...",
    });

    await action();
    await loadService(id, setState);

    setActionState({
      status: "success",
      message: successMessage,
    });
  } catch (error) {
    setActionState({
      status: "error",
      message: error.message,
    });
  }
}

function MetricsPanel({ metrics }) {
  const items = [
    ["Uptime", formatPercent(metrics.uptimePercentage)],
    ["Average response", formatMilliseconds(metrics.averageResponseTimeMs)],
    ["Total checks", metrics.totalChecks],
    ["Successful checks", metrics.successfulChecks],
    ["Failed checks", metrics.failedChecks],
  ];

  return (
    <section className="summary-grid" aria-label="Service metrics">
      {items.map(([label, value]) => (
        <article className="summary-card" key={label}>
          <span>{label}</span>
          <strong>{value}</strong>
        </article>
      ))}
    </section>
  );
}

function HealthChecksPanel({ healthChecks }) {
  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Recent health checks</h2>
        <span>{healthChecks.length} shown</span>
      </div>
      {healthChecks.length === 0 ? (
        <p className="muted-text">This service does not have health checks yet.</p>
      ) : (
        <div className="table-like" role="table" aria-label="Health checks">
          <div className="table-row table-head" role="row">
            <span>Status</span>
            <span>HTTP</span>
            <span>Response time</span>
            <span>Checked at</span>
          </div>
          {healthChecks.map((healthCheck) => (
            <div className="table-row" role="row" key={healthCheck.id}>
              <StatusBadge status={healthCheck.status} />
              <span>{healthCheck.statusCode ?? "N/A"}</span>
              <span>{formatMilliseconds(healthCheck.responseTimeMs)}</span>
              <span>{new Date(healthCheck.checkedAt).toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function formatPercent(value) {
  return value === null ? "No data" : `${value}%`;
}

function formatMilliseconds(value) {
  return value === null ? "No data" : `${value}ms`;
}

export default ServiceDetailPage;
