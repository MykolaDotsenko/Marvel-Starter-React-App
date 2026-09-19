export const Header = ({
  activeView,
  savedCount,
  readingCount,
  recentCount,
  onViewChange,
}) => {
  const items = [
    ["explore", "Explore", null],
    ["saved", "Saved", savedCount],
    ["reading", "Journey", readingCount],
    ["recent", "Recent", recentCount],
  ];

  return (
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
          <small>Comic discovery & reading journeys</small>
        </span>
      </button>

      <nav className="site-nav" aria-label="Reading Atlas views">
        {items.map(([view, label, count]) => (
          <button
            key={view}
            type="button"
            className={activeView === view ? "is-active" : ""}
            aria-pressed={activeView === view}
            onClick={() => onViewChange(view)}
          >
            <span>{label}</span>
            {count !== null ? (
              <strong className="nav-count" aria-label={`${count} items`}>
                {count}
              </strong>
            ) : null}
          </button>
        ))}
      </nav>
    </header>
  );
};
