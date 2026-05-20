const statusLabels = {
  UP: "Up",
  DOWN: "Down",
  UNKNOWN: "Unknown",
  OPEN: "Open",
  ACKNOWLEDGED: "Acknowledged",
  RESOLVED: "Resolved",
  OPERATIONAL: "Operational",
  MAJOR_OUTAGE: "Major outage",
};

function StatusBadge({ status }) {
  const normalizedStatus = status || "UNKNOWN";

  return (
    <span className={`status-badge status-${normalizedStatus.toLowerCase()}`}>
      {statusLabels[normalizedStatus] || normalizedStatus}
    </span>
  );
}

export default StatusBadge;
