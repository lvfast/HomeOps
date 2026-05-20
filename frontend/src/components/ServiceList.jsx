import { Link } from "react-router-dom";
import StatusBadge from "./StatusBadge.jsx";

function ServiceList({ services }) {
  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Services</h2>
        <span>{services.length} total</span>
      </div>
      <div className="table-like" role="table" aria-label="Services">
        <div className="table-row table-head" role="row">
          <span>Name</span>
          <span>Status</span>
          <span>Last checked</span>
          <span></span>
        </div>
        {services.map((service) => (
          <div className="table-row" role="row" key={service.id}>
            <span className="strong-text">{service.name}</span>
            <StatusBadge status={service.currentStatus} />
            <span>{formatDate(service.lastCheckedAt)}</span>
            <Link className="text-link" to={`/service/${service.id}`}>
              View
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}

function formatDate(value) {
  if (!value) {
    return "Never";
  }

  return new Date(value).toLocaleString();
}

export default ServiceList;
