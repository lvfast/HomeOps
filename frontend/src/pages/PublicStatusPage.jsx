import { useEffect, useState } from "react";
import ErrorState from "../components/ErrorState.jsx";
import LoadingState from "../components/LoadingState.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { getPublicStatus } from "../api.js";

function PublicStatusPage() {
  const [state, setState] = useState({
    status: "loading",
    publicStatus: null,
    error: null,
  });

  useEffect(() => {
    let ignore = false;

    async function loadStatus() {
      try {
        const response = await getPublicStatus();

        if (!ignore) {
          setState({
            status: "ready",
            publicStatus: response,
            error: null,
          });
        }
      } catch (error) {
        if (!ignore) {
          setState({
            status: "error",
            publicStatus: null,
            error: error.message,
          });
        }
      }
    }

    loadStatus();

    return () => {
      ignore = true;
    };
  }, []);

  if (state.status === "loading") {
    return <LoadingState label="Loading public status..." />;
  }

  if (state.status === "error") {
    return <ErrorState title="Public status could not load" message={state.error} />;
  }

  return (
    <div className="page-stack narrow-page">
      <section className="page-heading">
        <div>
          <p className="eyebrow">Public status</p>
          <h1>HomeOps Status</h1>
        </div>
        <StatusBadge status={state.publicStatus.status} />
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>Services</h2>
          <span>{state.publicStatus.services.length} active</span>
        </div>
        {state.publicStatus.services.length === 0 ? (
          <p className="muted-text">No active services are currently published.</p>
        ) : (
          <div className="status-list">
            {state.publicStatus.services.map((service) => (
              <article className="status-item" key={service.id}>
                <div>
                  <strong>{service.name}</strong>
                  <span>{formatDate(service.lastCheckedAt)}</span>
                </div>
                <StatusBadge status={service.status} />
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function formatDate(value) {
  return value ? `Last checked ${new Date(value).toLocaleString()}` : "Not checked yet";
}

export default PublicStatusPage;
