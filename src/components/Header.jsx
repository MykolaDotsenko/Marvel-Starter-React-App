export const Header = ({
  activeView,
  favoriteCount,
  recentCount,
  onViewChange,
}) => (
  <header className="site-header">
    <button
      className="brand brand--button"
      type="button"
      onClick={() => onViewChange("explore")}
      aria-label="Open Marvel Atlas explore view"
    >
      <span className="brand__mark" aria-hidden="true">MA</span>
      <span>
        <strong>Marvel Atlas</strong>
        <small>Character intelligence</small>
      </span>
    </button>

    <nav className="site-nav" aria-label="Discovery views">
      <button
        type="button"
        className={activeView === "explore" ? "is-active" : ""}
        aria-pressed={activeView === "explore"}
        onClick={() => onViewChange("explore")}
      >
        Explore
      </button>
      <button
        type="button"
        className={activeView === "saved" ? "is-active" : ""}
        aria-pressed={activeView === "saved"}
        onClick={() => onViewChange("saved")}
      >
        <span aria-hidden="true">★</span>
        Saved <strong>{favoriteCount}</strong>
      </button>
      <button
        type="button"
        className={activeView === "recent" ? "is-active" : ""}
        aria-pressed={activeView === "recent"}
        onClick={() => onViewChange("recent")}
      >
        Recent <strong>{recentCount}</strong>
      </button>
    </nav>
  </header>
);
