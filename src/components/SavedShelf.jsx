import { Icon } from "./Icon.jsx";
import { formatIssueDate } from "../ui/formatters.js";

export const SavedShelf = ({
  issues,
  selectedId,
  readingIds,
  onOpen,
  onSaved,
  onReading,
}) => {
  if (!issues.length) {
    return (
      <div className="status-card">
        <span className="status-card__code">SAVED / EMPTY</span>
        <h3>Your saved shelf is ready for its first issue.</h3>
        <p>Bookmark interesting comics in Explore, then return here to turn them into a journey.</p>
      </div>
    );
  }

  return (
    <div className="saved-shelf">
      {issues.map((issue, index) => {
        const inJourney = readingIds.has(issue.id);

        return (
          <article
            key={issue.id}
            className={`saved-row${selectedId === issue.id ? " is-selected" : ""}`}
          >
            <span className="saved-row__index" aria-hidden="true">
              {String(index + 1).padStart(2, "0")}
            </span>

            <button
              className="saved-row__open"
              type="button"
              onClick={() => onOpen(issue.id)}
              aria-label={`Open issue details for ${issue.title}`}
            >
              <span>{issue.seriesName}</span>
              <strong>{issue.title}</strong>
              <small>{formatIssueDate(issue.onSaleDate, { compact: true })}</small>
            </button>

            <div className="saved-row__actions">
              <button
                className="icon-action"
                type="button"
                aria-label={`Remove ${issue.title} from saved`}
                onClick={() => onSaved(issue)}
              >
                <Icon name="bookmark" size={17} />
              </button>
              <button
                className="secondary-action secondary-action--compact"
                type="button"
                aria-pressed={inJourney}
                onClick={() => onReading(issue)}
              >
                <Icon name={inJourney ? "check" : "plus"} size={16} />
                <span>{inJourney ? "In journey" : "Add to journey"}</span>
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
};
