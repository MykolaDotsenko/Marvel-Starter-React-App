const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const DetailSkeleton = () => (
  <div className="detail-card detail-card--skeleton" aria-label="Loading character details">
    <div className="skeleton-box detail-skeleton__hero" />
    <div className="skeleton-box skeleton-box--title" />
    <div className="skeleton-box detail-skeleton__line" />
    <div className="skeleton-box detail-skeleton__line" />
  </div>
);

export const CharacterDetail = ({
  characterId,
  character,
  comics,
  loading,
  error,
  favorite,
  recentCount,
  onFavorite,
  onClose,
}) => {
  if (!characterId) {
    return (
      <section className="detail-card detail-card--empty">
        <span className="detail-card__number" aria-hidden="true">01</span>
        <p className="eyebrow">Character intelligence</p>
        <h2>Select a character to open the dossier.</h2>
        <p>
          The detail rail keeps the active character in the URL, so refresh,
          browser navigation, and shared links preserve context.
        </p>
        <dl className="empty-metrics">
          <div>
            <dt>Recent locally</dt>
            <dd>{recentCount}</dd>
          </div>
          <div>
            <dt>Tracking</dt>
            <dd>None</dd>
          </div>
        </dl>
      </section>
    );
  }

  if (loading) return <DetailSkeleton />;

  if (error || !character) {
    return (
      <section className="detail-card status-card" role="alert">
        <span className="status-card__code">DOSSIER ERROR</span>
        <h2>Character details could not be loaded.</h2>
        <p>{error?.message || "The Marvel API returned no character."}</p>
        <button type="button" className="text-action" onClick={onClose}>
          Close dossier
        </button>
      </section>
    );
  }

  return (
    <section className="detail-card" aria-labelledby="character-detail-title">
      <div className="detail-card__toolbar">
        <span className="detail-card__status">
          <span aria-hidden="true" /> Live API
        </span>
        <button type="button" className="text-action" onClick={onClose}>
          Close
        </button>
      </div>

      <div className="detail-hero">
        {character.image ? (
          <img
            src={character.image}
            alt=""
            className={character.hasPlaceholderImage ? "is-placeholder" : ""}
          />
        ) : (
          <div className="image-fallback image-fallback--detail" aria-hidden="true">
            {character.name.slice(0, 1)}
          </div>
        )}
        <div className="detail-hero__overlay" />
        <div className="detail-hero__content">
          <p className="eyebrow">Character #{character.id}</p>
          <h2 id="character-detail-title">{character.name}</h2>
        </div>
      </div>

      <div className="detail-actions">
        <button
          type="button"
          className={favorite ? "primary-action is-favorite" : "primary-action"}
          aria-pressed={favorite}
          onClick={() => onFavorite(character.id)}
        >
          <span aria-hidden="true">{favorite ? "★" : "☆"}</span>
          {favorite ? "Saved" : "Save character"}
        </button>
        {character.detailUrl ? (
          <a
            className="secondary-action"
            href={character.detailUrl}
            target="_blank"
            rel="noreferrer"
          >
            Marvel profile ↗
          </a>
        ) : null}
      </div>

      <p className="detail-description">{character.description}</p>

      <dl className="detail-metrics">
        <div>
          <dt>Comics</dt>
          <dd>{character.comicCount.toLocaleString()}</dd>
        </div>
        <div>
          <dt>Series</dt>
          <dd>{character.seriesCount.toLocaleString()}</dd>
        </div>
        <div>
          <dt>Stories</dt>
          <dd>{character.storiesCount.toLocaleString()}</dd>
        </div>
      </dl>

      <div className="comic-section">
        <div className="comic-section__heading">
          <div>
            <p className="eyebrow">Recent appearances</p>
            <h3>Comics</h3>
          </div>
          <span>{comics.length} shown</span>
        </div>

        {comics.length ? (
          <ul className="comic-list">
            {comics.map((comic) => (
              <li key={comic.id}>
                {comic.detailUrl ? (
                  <a href={comic.detailUrl} target="_blank" rel="noreferrer">
                    <ComicRow comic={comic} />
                  </a>
                ) : (
                  <ComicRow comic={comic} />
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="comic-empty">
            No recent comic metadata is available for this character.
          </p>
        )}
      </div>
    </section>
  );
};

const ComicRow = ({ comic }) => (
  <>
    <span className="comic-row__image">
      {comic.image ? (
        <img src={comic.image} alt="" loading="lazy" decoding="async" />
      ) : (
        <span className="image-fallback" aria-hidden="true">M</span>
      )}
    </span>
    <span className="comic-row__copy">
      <strong>{comic.title}</strong>
      <small>
        {comic.issueNumber !== null ? `Issue #${comic.issueNumber}` : "Comic"}
        {comic.pageCount ? ` · ${comic.pageCount} pages` : ""}
      </small>
    </span>
    <span className="comic-row__price">
      {comic.price ? usd.format(comic.price) : "—"}
    </span>
  </>
);
