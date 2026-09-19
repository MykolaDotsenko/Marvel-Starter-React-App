import { Icon } from "./Icon.jsx";
import { formatIssueDate } from "../ui/formatters.js";

export const ReadingListPanel = ({
  items,
  selectedId,
  onOpen,
  onMarkRead,
  onMove,
  onRemove,
}) => {
  const completed = items.filter((item) => item.read).length;
  const nextUnread = items.find((item) => !item.read);
  const progress = items.length ? Math.round((completed / items.length) * 100) : 0;

  if (!items.length) {
    return (
      <div className="status-card">
        <span className="status-card__code">JOURNEY / EMPTY</span>
        <h3>Build a route through Marvel, not another bookmark pile.</h3>
        <p>Add issues from Explore or Saved. Reading Atlas keeps order and progress locally with no account.</p>
      </div>
    );
  }

  return (
    <div className="reading-board">
      <header className="reading-summary">
        <div className="reading-summary__copy">
          <p className="eyebrow">Route progress</p>
          <h3>{progress}% complete</h3>
          <p>{completed} of {items.length} issues read</p>
        </div>

        <div className="reading-summary__meter">
          <progress
            className="reading-progress"
            max={items.length}
            value={completed}
            aria-label={`${completed} of ${items.length} issues read`}
          />
          <span>{completed}/{items.length}</span>
        </div>

        {nextUnread ? (
          <button className="primary-action" type="button" onClick={() => onOpen(nextUnread.issue.id)}>
            Continue journey
          </button>
        ) : (
          <span className="reading-complete">Journey complete ✓</span>
        )}
      </header>

      <ol className="reading-list" aria-label="Ordered reading journey">
        {items.map((item, index) => (
          <li
            key={item.issue.id}
            className={[
              "reading-item",
              item.read ? "is-read" : "",
              selectedId === item.issue.id ? "is-selected" : "",
            ].filter(Boolean).join(" ")}
          >
            <span className="reading-item__route" aria-hidden="true">
              <span className="reading-item__marker">
                {item.read ? <Icon name="check" size={14} /> : String(index + 1).padStart(2, "0")}
              </span>
            </span>

            <button
              type="button"
              className="reading-item__open"
              onClick={() => onOpen(item.issue.id)}
              aria-label={`Open issue details for ${item.issue.title}`}
            >
              <span>{item.issue.seriesName}</span>
              <strong>{item.issue.title}</strong>
              <small>
                {formatIssueDate(item.issue.onSaleDate, { compact: true })}
                {item.issue.isUnlimited ? " · Unlimited" : ""}
              </small>
            </button>

            <div className="reading-item__controls">
              <button
                type="button"
                className="text-action"
                aria-pressed={item.read}
                onClick={() => onMarkRead(item.issue.id, !item.read)}
              >
                {item.read ? "Mark unread" : "Mark read"}
              </button>
              <button
                type="button"
                className="icon-action"
                disabled={index === 0}
                aria-label={`Move ${item.issue.title} up`}
                onClick={() => onMove(item.issue.id, -1)}
              >
                <Icon name="up" size={16} />
              </button>
              <button
                type="button"
                className="icon-action"
                disabled={index === items.length - 1}
                aria-label={`Move ${item.issue.title} down`}
                onClick={() => onMove(item.issue.id, 1)}
              >
                <Icon name="down" size={16} />
              </button>
              <button
                type="button"
                className="text-action reading-item__remove"
                aria-label={`Remove ${item.issue.title} from reading list`}
                onClick={() => onRemove(item.issue)}
              >
                Remove
              </button>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
};
