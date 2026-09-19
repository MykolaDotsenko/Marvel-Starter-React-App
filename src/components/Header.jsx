export const Header = ({
  activeView,
  savedCount,
  readingCount,
  recentCount,
  onViewChange,
}) => (
  <header className="site-header">
    <button
      className="brand brand--button"
      type="button"
      onClick={() => onViewChange("explore")}
      aria-label="Open Marvel Reading Atlas explore view"
    >
      <span className="brand__mark" aria-hidden="true">RA</span>
      <span>
        <strong>Marvel Reading Atlas</strong>
        <small>Comic discovery & reading plans</small>
      </span>
    </button>

    <nav className="site-nav" aria-label="Reading Atlas views">
      {[
        ["explore", "Explore", null],
        ["saved", "Saved", savedCount],
        ["reading", "Reading", readingCount],
        ["recent", "Recent", recentCount],
      ].map(([view, label, count]) => (
        <button
          key={view}
          type="button"
          className={activeView === view ? "is-active" : ""}
          aria-pressed={activeView === view}
          onClick={() => onViewChange(view)}
        >
          {label}
          {count !== null ? <strong>{count}</strong> : null}
        </button>
      ))}
    </nav>
  </header>
);
