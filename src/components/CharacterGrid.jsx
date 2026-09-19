const CharacterSkeleton = () => (
  <div className="character-card character-card--skeleton" aria-hidden="true">
    <div className="skeleton-box skeleton-box--image" />
    <div className="skeleton-box skeleton-box--title" />
    <div className="skeleton-box skeleton-box--meta" />
  </div>
);

const CharacterCard = ({
  character,
  selected,
  favorite,
  onSelect,
  onFavorite,
}) => (
  <article
    className={`character-card${selected ? " is-selected" : ""}`}
    data-character-id={character.id}
  >
    <button
      type="button"
      className="character-card__select"
      onClick={() => onSelect(character.id)}
      aria-pressed={selected}
      aria-label={`Open details for ${character.name}`}
    >
      <span className="character-card__media">
        {character.image ? (
          <img
            src={character.image}
            alt=""
            loading="lazy"
            decoding="async"
            className={character.hasPlaceholderImage ? "is-placeholder" : ""}
          />
        ) : (
          <span className="image-fallback" aria-hidden="true">
            {character.name.slice(0, 1)}
          </span>
        )}
        <span className="character-card__index" aria-hidden="true">
          {String(character.id).slice(-4)}
        </span>
      </span>
      <span className="character-card__body">
        <strong>{character.name}</strong>
        <span>
          {character.comicCount.toLocaleString()} comics ·{" "}
          {character.seriesCount.toLocaleString()} series
        </span>
      </span>
    </button>

    <button
      type="button"
      className="favorite-action"
      aria-pressed={favorite}
      aria-label={
        favorite
          ? `Remove ${character.name} from favorites`
          : `Save ${character.name} to favorites`
      }
      onClick={() => onFavorite(character.id)}
    >
      <span aria-hidden="true">{favorite ? "★" : "☆"}</span>
    </button>
  </article>
);

export const CharacterGrid = ({
  characters,
  selectedId,
  favorites,
  loading,
  loadingMore = false,
  error,
  ended = true,
  onSelect,
  onFavorite,
  onLoadMore,
  onRetryInitial,
  showPagination = true,
  emptyTitle = "No characters matched this prefix.",
  emptyDescription = "Try a shorter name or one of the quick-search prompts above.",
}) => {
  if (loading) {
    return (
      <div className="character-grid" aria-label="Loading characters">
        {Array.from({ length: 6 }, (_, index) => (
          <CharacterSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (error && characters.length === 0) {
    return (
      <div className="status-card" role="alert">
        <span className="status-card__code">API / RETRY</span>
        <h3>Marvel data is temporarily unavailable.</h3>
        <p>{error.message || "The request could not be completed."}</p>
        {onRetryInitial ? (
          <button
            className="secondary-action"
            type="button"
            onClick={onRetryInitial}
          >
            Retry request
          </button>
        ) : null}
      </div>
    );
  }

  if (characters.length === 0) {
    return (
      <div className="status-card">
        <span className="status-card__code">0 ITEMS</span>
        <h3>{emptyTitle}</h3>
        <p>{emptyDescription}</p>
      </div>
    );
  }

  return (
    <>
      <div className="character-grid">
        {characters.map((character) => (
          <CharacterCard
            key={character.id}
            character={character}
            selected={selectedId === character.id}
            favorite={favorites.has(character.id)}
            onSelect={onSelect}
            onFavorite={onFavorite}
          />
        ))}
      </div>

      {showPagination ? (
        <div className="load-more">
          {error ? (
            <p className="load-more__error" role="alert">
              The next page failed to load. Your current results are preserved.
            </p>
          ) : null}
          {!ended ? (
            <button
              className="secondary-action"
              type="button"
              disabled={loadingMore}
              onClick={onLoadMore}
            >
              {loadingMore
                ? "Loading…"
                : error
                  ? "Retry next page"
                  : "Load 12 more"}
            </button>
          ) : (
            <p className="load-more__end">End of available results.</p>
          )}
        </div>
      ) : null}
    </>
  );
};
