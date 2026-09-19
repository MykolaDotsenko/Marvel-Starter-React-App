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
        <span className="status-card__code">READING LIST / EMPTY</span>
        <h3>Build a reading journey, not another bookmark pile.</h3>
        <p>
          Add issues from Explore or a dossier. Order, progress and issue
          snapshots stay in this browser with no account.
        </p>
      </div>
    );
  }

  return (
    <div className="reading-board">
      <header className="reading-summary">
        <div>
          <p className="eyebrow">Reading progress</p>
          <h3>{progress}% complete</h3>
          <p>{completed} of {items.length} issues read</p>
        </div>

        <progress
          className="reading-progress"
          max={items.length}
          value={completed}
          aria-label={`${completed} of ${items.length} issues read`}
        />

        {nextUnread ? (
          <button className="primary-action" type="button" onClick={() => onOpen(nextUnread.issue.id)}>
            Continue reading
          </button>
        ) : (
          <span className="reading-complete">Journey complete ✓</span>
        )}
      </header>

      <ol className="reading-list">
        {items.map((item, index) => (
          <li
            key={item.issue.id}
            className={[
              "reading-item",
              item.read ? "is-read" : "",
              selectedId === item.issue.id ? "is-selected" : "",
            ].filter(Boolean).join(" ")}
          >
            <span className="reading-item__index" aria-hidden="true">
              {String(index + 1).padStart(2, "0")}
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
                {item.issue.onSaleDate || "Date unavailable"}
                {item.issue.isUnlimited ? " · Marvel Unlimited" : ""}
              </small>
            </button>

            <div className="reading-item__controls">
              <button
                type="button"
                className="text-action"
                aria-pressed={item.read}
                onClick={() => onMarkRead(item.issue.id, !item.read)}
              >
                {item.read ? "Unread" : "Read"}
              </button>
              <button
                type="button"
                className="icon-action"
                disabled={index === 0}
                aria-label={`Move ${item.issue.title} up`}
                onClick={() => onMove(item.issue.id, -1)}
              >↑</button>
              <button
                type="button"
                className="icon-action"
                disabled={index === items.length - 1}
                aria-label={`Move ${item.issue.title} down`}
                onClick={() => onMove(item.issue.id, 1)}
              >↓</button>
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
