import { Icon } from "./Icon.jsx";
import { formatRecentTimestamp } from "../ui/formatters.js";

export const RecentTimeline = ({
  entries,
  selectedId,
  savedIds,
  readingIds,
  onOpen,
  onSaved,
  onReading,
}) => {
  if (!entries.length) {
    return (
      <div className="status-card">
        <span className="status-card__code">RECENT / EMPTY</span>
        <h3>Your exploration history will appear here.</h3>
        <p>Open an issue dossier and Reading Atlas will keep a small local trail for you.</p>
      </div>
    );
  }

  return (
    <ol className="recent-timeline">
      {entries.map((entry) => {
        const issue = entry.issue;
        const saved = savedIds.has(issue.id);
        const inJourney = readingIds.has(issue.id);

        return (
          <li
            key={issue.id}
            className={`recent-item${selectedId === issue.id ? " is-selected" : ""}`}
          >
            <span className="recent-item__rail" aria-hidden="true">
              <span />
            </span>

            <button
              className="recent-item__open"
              type="button"
              onClick={() => onOpen(issue.id)}
              aria-label={`Open issue details for ${issue.title}`}
            >
              <span className="recent-item__meta">
                <Icon name="clock" size={14} />
                {formatRecentTimestamp(entry.viewedAt)}
              </span>
              <strong>{issue.title}</strong>
              <small>{issue.seriesName}</small>
            </button>

            <div className="recent-item__actions">
              <button
                className="icon-action"
                type="button"
                aria-pressed={saved}
                aria-label={saved ? `Remove ${issue.title} from saved` : `Save ${issue.title}`}
                onClick={() => onSaved(issue)}
              >
                <Icon name="bookmark" size={17} />
              </button>
              <button
                className="icon-action"
                type="button"
                aria-pressed={inJourney}
                aria-label={
                  inJourney
                    ? `Remove ${issue.title} from reading list`
                    : `Add ${issue.title} to reading list`
                }
                onClick={() => onReading(issue)}
              >
                <Icon name={inJourney ? "check" : "plus"} size={17} />
              </button>
            </div>
          </li>
        );
      })}
    </ol>
  );
};
