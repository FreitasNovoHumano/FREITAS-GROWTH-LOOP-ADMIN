export default function DashboardLoading() {
  return (
    <div aria-live="polite" aria-busy="true">
      <div className="skeleton skeleton-title" />
      <div className="metric-grid">
        {Array.from({ length: 6 }, (_, index) => (
          <div className="metric-card skeleton-card" key={index}>
            <div className="skeleton skeleton-icon" />
            <div className="skeleton skeleton-value" />
            <div className="skeleton skeleton-line" />
          </div>
        ))}
      </div>
      <div className="panel skeleton-panel">
        <div className="skeleton skeleton-line" />
        <div className="skeleton skeleton-line" />
        <div className="skeleton skeleton-line" />
      </div>
    </div>
  );
}
