const dateFormatter = new Intl.DateTimeFormat("en", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

const formatDate = (value) => {
  if (!value) return "Unknown";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : dateFormatter.format(date);
};

const DetailSkeleton = () => (
  <div className="detail-card detail-card--skeleton" aria-label="Loading issue details">
    <div className="skeleton-box detail-skeleton__hero" />
    <div className="skeleton-box skeleton-box--title" />
    <div className="skeleton-box detail-skeleton__line" />
  </div>
);

export const IssueDetail = ({
  issueId,
  issue,
  loading,
  error,
  saved,
  readingEntry,
  readingCount,
  onSaved,
  onReading,
  onReadToggle,
  onClose,
}) => {
  if (!issueId) {
    return (
      <section className="detail-card detail-card--empty">
        <span className="detail-card__number" aria-hidden="true">01</span>
        <p className="eyebrow">Reading intelligence</p>
        <h2>Select an issue to open its reading dossier.</h2>
        <p>
          The selected issue lives in the URL, so refresh, Back/Forward and
          shared links preserve discovery context.
        </p>
        <dl className="empty-metrics">
          <div><dt>Reading list</dt><dd>{readingCount}</dd></div>
          <div><dt>Tracking</dt><dd>Local</dd></div>
        </dl>
      </section>
    );
  }

  if (loading) return <DetailSkeleton />;

  if (error || !issue) {
    return (
      <section className="detail-card status-card" role="alert">
        <span className="status-card__code">DOSSIER ERROR</span>
        <h2>Issue details could not be loaded.</h2>
        <p>{error?.message || "The metadata provider returned no issue."}</p>
        <button type="button" className="text-action" onClick={onClose}>
          Close dossier
        </button>
      </section>
    );
  }

  return (
    <section className="detail-card" aria-labelledby="issue-detail-title">
      <div className="detail-card__toolbar">
        <span className="detail-card__status">
          <span aria-hidden="true" /> Community metadata
        </span>
        <button type="button" className="text-action" onClick={onClose}>Close</button>
      </div>

      <div className="detail-hero">
        <div className="detail-cover">
          {issue.cover ? (
            <img src={issue.cover} alt="" loading="eager" decoding="async" />
          ) : (
            <span className="image-fallback image-fallback--detail" aria-hidden="true">
              {issue.issueNumber ? `#${issue.issueNumber}` : "M"}
            </span>
          )}
        </div>
        <div className="detail-hero__content">
          <p className="eyebrow">{issue.seriesName}</p>
          <h2 id="issue-detail-title">{issue.title}</h2>
          <p className="detail-hero__date">
            {formatDate(issue.onSaleDate)}
            {issue.isUnlimited ? " · Marvel Unlimited" : ""}
          </p>
        </div>
      </div>

      <div className="detail-actions">
        <button
          type="button"
          className={saved ? "primary-action is-favorite" : "primary-action"}
          aria-pressed={saved}
          onClick={() => onSaved(issue)}
        >
          <span aria-hidden="true">{saved ? "★" : "☆"}</span>
          {saved ? "Saved" : "Save issue"}
        </button>

        <button
          type="button"
          className="secondary-action"
          aria-pressed={Boolean(readingEntry)}
          onClick={() => onReading(issue)}
        >
          <span aria-hidden="true">{readingEntry ? "✓" : "+"}</span>
          {readingEntry ? "In reading list" : "Add to reading list"}
        </button>

        {readingEntry ? (
          <button
            type="button"
            className="secondary-action"
            aria-pressed={readingEntry.read}
            onClick={() => onReadToggle(issue.id, !readingEntry.read)}
          >
            {readingEntry.read ? "Mark unread" : "Mark as read"}
          </button>
        ) : null}
      </div>

      <p className="detail-description">{issue.description}</p>

      <dl className="detail-metrics">
        <div><dt>Issue</dt><dd>{issue.issueNumber ? `#${issue.issueNumber}` : "—"}</dd></div>
        <div><dt>Pages</dt><dd>{issue.pageCount ?? "—"}</dd></div>
        <div><dt>Creators</dt><dd>{issue.creators.length}</dd></div>
      </dl>

      <div className="creator-section">
        <div className="comic-section__heading">
          <div><p className="eyebrow">Credits</p><h3>Creators</h3></div>
          <span>{issue.creators.length} listed</span>
        </div>
        {issue.creators.length ? (
          <ul className="creator-list">
            {issue.creators.map((creator) => (
              <li key={`${creator.id}-${creator.role}`}>
                <strong>{creator.name}</strong>
                <span>{creator.role}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="comic-empty">Creator metadata is unavailable.</p>
        )}
      </div>

      <div className="detail-source">
        <div><span>Series</span><strong>{issue.seriesName}</strong></div>
        <div><span>On sale</span><strong>{formatDate(issue.onSaleDate)}</strong></div>
      </div>

      {issue.detailUrl ? (
        <div className="detail-external">
          <a className="secondary-action" href={issue.detailUrl} target="_blank" rel="noreferrer">
            Open on Marvel ↗
          </a>
        </div>
      ) : null}
    </section>
  );
};
