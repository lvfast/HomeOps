import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ErrorState from "../components/ErrorState.jsx";
import LoadingState from "../components/LoadingState.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import {
  getService,
  getServiceHealthChecks,
  getServiceMetrics,
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

  useEffect(() => {
    let ignore = false;

    async function loadService() {
      try {
        const [serviceResponse, metricsResponse, healthChecksResponse] =
          await Promise.all([
            getService(id),
            getServiceMetrics(id),
            getServiceHealthChecks(id),
          ]);

        if (!ignore) {
          setState({
            status: "ready",
            service: serviceResponse.service,
            metrics: metricsResponse.metrics,
            healthChecks: healthChecksResponse.healthChecks.slice(0, 10),
            error: null,
          });
        }
      } catch (error) {
        if (!ignore) {
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

    loadService();

    return () => {
      ignore = true;
    };
  }, [id]);

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
        <StatusBadge status={state.service.currentStatus} />
      </section>

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
