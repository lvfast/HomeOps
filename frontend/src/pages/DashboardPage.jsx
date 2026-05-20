import { useEffect, useState } from "react";
import EmptyState from "../components/EmptyState.jsx";
import ErrorState from "../components/ErrorState.jsx";
import LoadingState from "../components/LoadingState.jsx";
import ServiceCreateForm from "../components/ServiceCreateForm.jsx";
import ServiceList from "../components/ServiceList.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import SummaryCards from "../components/SummaryCards.jsx";
import { createService, getDashboardSummary, getServices } from "../api.js";

function DashboardPage() {
  const [state, setState] = useState({
    status: "loading",
    summary: null,
    services: [],
    error: null,
  });
  const [createState, setCreateState] = useState({
    status: "idle",
    message: null,
  });

  useEffect(() => {
    let ignore = false;

    loadDashboard(setState, () => ignore);

    return () => {
      ignore = true;
    };
  }, []);

  async function handleCreateService(payload) {
    try {
      setCreateState({
        status: "loading",
        message: "Creating service...",
      });

      await createService(payload);
      await loadDashboard(setState);

      setCreateState({
        status: "success",
        message: "Service created.",
      });

      return true;
    } catch (error) {
      setCreateState({
        status: "error",
        message: error.message,
      });

      return false;
    }
  }

  if (state.status === "loading") {
    return <LoadingState label="Loading dashboard..." />;
  }

  if (state.status === "error") {
    return (
      <ErrorState
        title="Dashboard could not load"
        message={`${state.error}. Check that the backend API is running on port 3000.`}
      />
    );
  }

  return (
    <div className="page-stack">
      <section className="page-heading">
        <div>
          <p className="eyebrow">Overview</p>
          <h1>Dashboard</h1>
        </div>
        <p>Service health, open incidents, and recent outage history.</p>
      </section>

      <SummaryCards summary={state.summary} />

      <ServiceCreateForm
        isSubmitting={createState.status === "loading"}
        onCreate={handleCreateService}
      />

      {createState.message ? (
        <p
          className={`action-message ${
            createState.status === "error" ? "action-error" : "action-success"
          }`}
        >
          {createState.message}
        </p>
      ) : null}

      {state.services.length === 0 ? (
        <EmptyState
          title="No services yet"
          message="Create a monitored service to see it here."
        />
      ) : (
        <ServiceList services={state.services} />
      )}

      <RecentIncidents incidents={state.summary.recentIncidents} />
    </div>
  );
}

async function loadDashboard(setState, shouldIgnore = () => false) {
  try {
    const [summaryResponse, servicesResponse] = await Promise.all([
      getDashboardSummary(),
      getServices(),
    ]);

    if (!shouldIgnore()) {
      setState({
        status: "ready",
        summary: summaryResponse.summary,
        services: servicesResponse.services,
        error: null,
      });
    }
  } catch (error) {
    if (!shouldIgnore()) {
      setState({
        status: "error",
        summary: null,
        services: [],
        error: error.message,
      });
    }
  }
}

function RecentIncidents({ incidents }) {
  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Recent incidents</h2>
        <span>{incidents.length} shown</span>
      </div>
      {incidents.length === 0 ? (
        <p className="muted-text">No incidents have been recorded yet.</p>
      ) : (
        <div className="incident-list">
          {incidents.map((incident) => (
            <article className="incident-item" key={incident.id}>
              <div>
                <strong>{incident.title}</strong>
                <span>{new Date(incident.startedAt).toLocaleString()}</span>
              </div>
              <StatusBadge status={incident.status} />
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default DashboardPage;
