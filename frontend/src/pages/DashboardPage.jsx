import { useEffect, useState } from "react";
import EmptyState from "../components/EmptyState.jsx";
import ErrorState from "../components/ErrorState.jsx";
import LoadingState from "../components/LoadingState.jsx";
import ServiceList from "../components/ServiceList.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import SummaryCards from "../components/SummaryCards.jsx";
import { getDashboardSummary, getServices } from "../api.js";

function DashboardPage() {
  const [state, setState] = useState({
    status: "loading",
    summary: null,
    services: [],
    error: null,
  });

  useEffect(() => {
    let ignore = false;

    async function loadDashboard() {
      try {
        const [summaryResponse, servicesResponse] = await Promise.all([
          getDashboardSummary(),
          getServices(),
        ]);

        if (!ignore) {
          setState({
            status: "ready",
            summary: summaryResponse.summary,
            services: servicesResponse.services,
            error: null,
          });
        }
      } catch (error) {
        if (!ignore) {
          setState({
            status: "error",
            summary: null,
            services: [],
            error: error.message,
          });
        }
      }
    }

    loadDashboard();

    return () => {
      ignore = true;
    };
  }, []);

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

      {state.services.length === 0 ? (
        <EmptyState
          title="No services yet"
          message="Create a monitored service through the API to see it here."
        />
      ) : (
        <ServiceList services={state.services} />
      )}

      <RecentIncidents incidents={state.summary.recentIncidents} />
    </div>
  );
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
