function SummaryCards({ summary }) {
  const cards = [
    ["Total services", summary.services.total],
    ["Active services", summary.services.active],
    ["Up", summary.services.up],
    ["Down", summary.services.down],
    ["Active incidents", summary.incidents.active],
  ];

  return (
    <section className="summary-grid" aria-label="Dashboard summary">
      {cards.map(([label, value]) => (
        <article className="summary-card" key={label}>
          <span>{label}</span>
          <strong>{value}</strong>
        </article>
      ))}
    </section>
  );
}

export default SummaryCards;
