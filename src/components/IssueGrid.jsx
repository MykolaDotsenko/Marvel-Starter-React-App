const IssueSkeleton = () => (
  <div className="issue-card issue-card--skeleton" aria-hidden="true">
    <div className="skeleton-box issue-skeleton__signal" />
    <div className="skeleton-box skeleton-box--title" />
    <div className="skeleton-box skeleton-box--meta" />
  </div>
);

const IssueCard = ({
  issue,
  selected,
  saved,
  inReadingList,
  onSelect,
  onSaved,
  onReading,
}) => (
  <article
    className={`issue-card${selected ? " is-selected" : ""}`}
    data-issue-id={issue.id}
  >
    <button
      type="button"
      className="issue-card__select"
      onClick={() => onSelect(issue.id)}
      aria-pressed={selected}
      aria-label={`Open issue details for ${issue.title}`}
    >
      <span className="issue-card__signal" aria-hidden="true">
        <span>{issue.issueNumber ? `#${issue.issueNumber}` : "ISSUE"}</span>
        <strong>{issue.year ?? "—"}</strong>
      </span>
      <span className="issue-card__body">
        <span className="issue-card__series">{issue.seriesName}</span>
        <strong>{issue.title}</strong>
        <span className="issue-card__meta">
          {issue.onSaleDate || "Publication date unavailable"}
          {issue.isUnlimited ? " · Marvel Unlimited" : ""}
        </span>
      </span>
    </button>

    <div className="issue-card__actions">
      <button
        type="button"
        className="card-action"
        aria-pressed={saved}
        aria-label={saved ? `Remove ${issue.title} from saved` : `Save ${issue.title}`}
        onClick={() => onSaved(issue)}
      >
        <span aria-hidden="true">{saved ? "★" : "☆"}</span>
      </button>
      <button
        type="button"
        className="card-action"
        aria-pressed={inReadingList}
        aria-label={
          inReadingList
            ? `Remove ${issue.title} from reading list`
            : `Add ${issue.title} to reading list`
        }
        onClick={() => onReading(issue)}
      >
        <span aria-hidden="true">{inReadingList ? "✓" : "+"}</span>
      </button>
    </div>
  </article>
);

export const IssueGrid = ({
  issues,
  selectedId,
  savedIds,
  readingIds,
  loading,
  loadingMore = false,
  error,
  ended = true,
  onSelect,
  onSaved,
  onReading,
  onLoadMore,
  onRetryInitial,
  showPagination = true,
  emptyTitle = "No issues matched this search.",
  emptyDescription = "Try a broader title or one of the quick searches above.",
}) => {
  if (loading) {
    return (
      <div className="issue-grid" aria-label="Loading comic issues">
        {Array.from({ length: 6 }, (_, index) => (
          <IssueSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (error && issues.length === 0) {
    return (
      <div className="status-card" role="alert">
        <span className="status-card__code">METADATA / RETRY</span>
        <h3>Comic metadata is temporarily unavailable.</h3>
        <p>{error.message || "The request could not be completed."}</p>
        {onRetryInitial ? (
          <button className="secondary-action" type="button" onClick={onRetryInitial}>
            Retry request
          </button>
        ) : null}
      </div>
    );
  }

  if (issues.length === 0) {
    return (
      <div className="status-card">
        <span className="status-card__code">0 ISSUES</span>
        <h3>{emptyTitle}</h3>
        <p>{emptyDescription}</p>
      </div>
    );
  }

  return (
    <>
      <div className="issue-grid">
        {issues.map((issue) => (
          <IssueCard
            key={issue.id}
            issue={issue}
            selected={selectedId === issue.id}
            saved={savedIds.has(issue.id)}
            inReadingList={readingIds.has(issue.id)}
            onSelect={onSelect}
            onSaved={onSaved}
            onReading={onReading}
          />
        ))}
      </div>

      {showPagination ? (
        <div className="load-more">
          {error ? (
            <p className="load-more__error" role="alert">
              The next page failed to load. Current results are preserved.
            </p>
          ) : null}
          {!ended ? (
            <button
              className="secondary-action"
              type="button"
              disabled={loadingMore}
              onClick={onLoadMore}
            >
              {loadingMore ? "Loading…" : error ? "Retry next page" : "Load 12 more"}
            </button>
          ) : (
            <p className="load-more__end">End of available results.</p>
          )}
        </div>
      ) : null}
    </>
  );
};
