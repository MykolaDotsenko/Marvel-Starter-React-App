import { Icon } from "./Icon.jsx";

const items = [
  ["explore", "Explore", "compass"],
  ["saved", "Saved", "bookmark"],
  ["reading", "Journey", "route"],
  ["recent", "Recent", "clock"],
];

export const MobileNav = ({
  activeView,
  savedCount,
  readingCount,
  recentCount,
  onViewChange,
}) => {
  const counts = {
    saved: savedCount,
    reading: readingCount,
    recent: recentCount,
  };

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile Reading Atlas views">
      {items.map(([view, label, icon]) => {
        const count = counts[view];
        const countLabel = Number.isFinite(count)
          ? `${count} ${count === 1 ? "item" : "items"}`
          : null;

        return (
          <button
            key={view}
            type="button"
            className={activeView === view ? "is-active" : ""}
            aria-label={countLabel ? `${label} ${countLabel}` : label}
            aria-pressed={activeView === view}
            onClick={() => onViewChange(view)}
          >
            <span className="mobile-bottom-nav__icon">
              <Icon name={icon} size={20} />
              {Number.isFinite(count) && count > 0 ? (
                <strong aria-hidden="true">{count}</strong>
              ) : null}
            </span>
            <span>{label}</span>
          </button>
        );
      })}
    </nav>
  );
};
