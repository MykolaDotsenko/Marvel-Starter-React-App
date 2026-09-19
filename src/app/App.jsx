import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { CharacterDetail } from "../components/CharacterDetail.jsx";
import { CharacterGrid } from "../components/CharacterGrid.jsx";
import { Header } from "../components/Header.jsx";
import { SearchPanel } from "../components/SearchPanel.jsx";
import { useCharacterCollection } from "../hooks/useCharacterCollection.js";
import { useCharacterDetails } from "../hooks/useCharacterDetails.js";
import { useCharacterList } from "../hooks/useCharacterList.js";
import { useUrlState } from "../hooks/useUrlState.js";
import {
  loadPreferences,
  rememberCharacter,
  savePreferences,
  toggleFavorite,
} from "../storage/preferences.js";

const quickSearches = ["Spider", "Iron", "Black", "Captain", "Thor"];

const viewCopy = {
  explore: {
    eyebrow: "Discovery queue",
    title: "Browse characters",
    emptyTitle: "No characters matched this prefix.",
    emptyDescription:
      "Try a shorter name or one of the quick-search prompts above.",
  },
  saved: {
    eyebrow: "Local shortlist",
    title: "Saved characters",
    emptyTitle: "Your shortlist is empty.",
    emptyDescription:
      "Save useful characters from Explore or a dossier and they will appear here.",
  },
  recent: {
    eyebrow: "Local history",
    title: "Recently viewed",
    emptyTitle: "No recent characters yet.",
    emptyDescription:
      "Open a character dossier and it will appear here automatically.",
  },
};

const App = () => {
  const [urlState, setUrlState] = useUrlState();
  const [preferences, setPreferences] = useState(loadPreferences);

  const rememberViewedCharacter = useCallback((character) => {
    setPreferences((current) => rememberCharacter(current, character.id));
  }, []);

  const characters = useCharacterList(urlState.query);
  const detail = useCharacterDetails(urlState.characterId, {
    onLoaded: rememberViewedCharacter,
  });
  const savedCharacters = useCharacterCollection(preferences.favorites);
  const recentCharacters = useCharacterCollection(preferences.recent);

  useEffect(() => {
    savePreferences(preferences);
  }, [preferences]);

  const favoriteSet = useMemo(
    () => new Set(preferences.favorites),
    [preferences.favorites],
  );

  const submitSearch = (query) => {
    startTransition(() => {
      setUrlState({ query, characterId: null, view: "explore" });
    });
  };

  const selectCharacter = (characterId) => {
    startTransition(() => {
      setUrlState({ characterId });
    });
  };

  const changeView = (view) => {
    startTransition(() => {
      setUrlState({ view });
    });
  };

  const toggleSelectedFavorite = (characterId) => {
    setPreferences((current) => toggleFavorite(current, characterId));
  };

  const activeCollection =
    urlState.view === "saved"
      ? savedCharacters
      : urlState.view === "recent"
        ? recentCharacters
        : characters;

  const copy = viewCopy[urlState.view];
  const isExplore = urlState.view === "explore";
  const title =
    isExplore && urlState.query
      ? `Characters starting with “${urlState.query}”`
      : copy.title;

  return (
    <div className="app-shell">
      <Header
        activeView={urlState.view}
        favoriteCount={preferences.favorites.length}
        recentCount={preferences.recent.length}
        onViewChange={changeView}
      />

      <main id="main-content">
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero__copy">
            <p className="eyebrow">Marvel Atlas / character intelligence</p>
            <h1 id="hero-title">
              Explore the Marvel universe without losing the signal.
            </h1>
            <p className="hero__lede">
              Search characters, inspect their latest comics, keep a local
              shortlist, and share the exact discovery state through the URL.
            </p>
          </div>

          <div className="hero__metrics" aria-label="Product capabilities">
            <div>
              <strong>10s</strong>
              <span>bounded API timeout</span>
            </div>
            <div>
              <strong>50</strong>
              <span>bounded cache entries</span>
            </div>
            <div>
              <strong>0</strong>
              <span>runtime UI libraries</span>
            </div>
          </div>
        </section>

        <SearchPanel
          key={urlState.query}
          activeQuery={urlState.query}
          onSubmit={submitSearch}
          quickSearches={quickSearches}
        />

        <div className="workspace">
          <section className="explorer" aria-labelledby="explorer-title">
            <div className="section-heading">
              <div>
                <p className="eyebrow">{copy.eyebrow}</p>
                <h2 id="explorer-title">{title}</h2>
              </div>
              <p className="section-heading__meta" aria-live="polite">
                {activeCollection.loading
                  ? "Loading characters…"
                  : `${activeCollection.items.length} loaded`}
              </p>
            </div>

            <CharacterGrid
              characters={activeCollection.items}
              selectedId={urlState.characterId}
              favorites={favoriteSet}
              loading={activeCollection.loading}
              loadingMore={isExplore ? characters.loadingMore : false}
              error={activeCollection.error}
              ended={isExplore ? characters.ended : true}
              onSelect={selectCharacter}
              onFavorite={toggleSelectedFavorite}
              onLoadMore={isExplore ? characters.loadMore : undefined}
              onRetryInitial={isExplore ? characters.retryInitial : undefined}
              showPagination={isExplore}
              emptyTitle={copy.emptyTitle}
              emptyDescription={copy.emptyDescription}
            />
          </section>

          <aside className="detail-rail" aria-label="Character intelligence">
            <CharacterDetail
              characterId={urlState.characterId}
              character={detail.character}
              comics={detail.comics}
              loading={detail.loading}
              error={detail.error}
              favorite={
                urlState.characterId
                  ? favoriteSet.has(urlState.characterId)
                  : false
              }
              recentCount={preferences.recent.length}
              onFavorite={toggleSelectedFavorite}
              onClose={() => setUrlState({ characterId: null })}
            />
          </aside>
        </div>
      </main>

      <footer className="site-footer">
        <p>
          Data provided by Marvel. © 2026 MARVEL. Portfolio project; no account,
          analytics, or tracking.
        </p>
      </footer>
    </div>
  );
};

export default App;
