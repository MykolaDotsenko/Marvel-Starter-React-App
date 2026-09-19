import { Icon } from "./Icon.jsx";
import { formatIssueDate } from "../ui/formatters.js";

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
        <h2>Select an issue to open its dossier.</h2>
        <p>
          Pick any issue to inspect credits and metadata, then save it or place it
          into your reading journey.
        </p>
        <dl className="empty-metrics">
          <div><dt>Journey</dt><dd>{readingCount}</dd></div>
          <div><dt>Storage</dt><dd>Local</dd></div>
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
        <button type="button" className="text-action detail-close" onClick={onClose}>
          <Icon name="close" size={15} />
          <span>Close</span>
        </button>
      </div>

      <div className="detail-hero">
        {issue.cover ? (
          <img className="detail-backdrop" src={issue.cover} alt="" aria-hidden="true" />
        ) : null}
        <div className="detail-hero__veil" aria-hidden="true" />

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
            {formatIssueDate(issue.onSaleDate)}
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
          <Icon name="bookmark" size={17} />
          {saved ? "Saved" : "Save issue"}
        </button>

        <button
          type="button"
          className="secondary-action"
          aria-pressed={Boolean(readingEntry)}
          onClick={() => onReading(issue)}
        >
          <Icon name={readingEntry ? "check" : "plus"} size={17} />
          {readingEntry ? "In journey" : "Add to journey"}
        </button>

        {readingEntry ? (
          <button
            type="button"
            className="secondary-action"
            aria-pressed={readingEntry.read}
            onClick={() => onReadToggle(issue.id, !readingEntry.read)}
          >
            <Icon name="check" size={16} />
            {readingEntry.read ? "Mark unread" : "Mark read"}
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
        <div><span>On sale</span><strong>{formatIssueDate(issue.onSaleDate)}</strong></div>
      </div>

      {issue.detailUrl ? (
        <div className="detail-external">
          <a className="secondary-action" href={issue.detailUrl} target="_blank" rel="noreferrer">
            Open on Marvel
            <Icon name="external" size={16} />
          </a>
        </div>
      ) : null}
    </section>
  );
};
