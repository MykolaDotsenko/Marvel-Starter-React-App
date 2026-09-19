import { startTransition, useEffect, useMemo, useState } from "react";
import { CharacterDetail } from "../components/CharacterDetail.jsx";
import { CharacterGrid } from "../components/CharacterGrid.jsx";
import { Header } from "../components/Header.jsx";
import { SearchPanel } from "../components/SearchPanel.jsx";
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

const App = () => {
  const [urlState, setUrlState] = useUrlState();
  const [preferences, setPreferences] = useState(loadPreferences);

  const characters = useCharacterList(urlState.query);
  const detail = useCharacterDetails(urlState.characterId);

  useEffect(() => {
    savePreferences(preferences);
  }, [preferences]);

  const favoriteSet = useMemo(
    () => new Set(preferences.favorites),
    [preferences.favorites],
  );

  const submitSearch = (query) => {
    startTransition(() => {
      setUrlState({ query, characterId: null });
    });
  };

  const selectCharacter = (characterId) => {
    setPreferences((current) => rememberCharacter(current, characterId));
    startTransition(() => {
      setUrlState({ characterId });
    });
  };

  const toggleSelectedFavorite = (characterId) => {
    setPreferences((current) => toggleFavorite(current, characterId));
  };

  return (
    <div className="app-shell">
      <Header favoriteCount={preferences.favorites.length} />

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
              <strong>5m</strong>
              <span>safe response cache</span>
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
                <p className="eyebrow">Discovery queue</p>
                <h2 id="explorer-title">
                  {urlState.query
                    ? `Characters starting with “${urlState.query}”`
                    : "Browse characters"}
                </h2>
              </div>
              <p className="section-heading__meta" aria-live="polite">
                {characters.loading
                  ? "Loading characters…"
                  : `${characters.items.length} loaded`}
              </p>
            </div>

            <CharacterGrid
              characters={characters.items}
              selectedId={urlState.characterId}
              favorites={favoriteSet}
              loading={characters.loading}
              loadingMore={characters.loadingMore}
              error={characters.error}
              ended={characters.ended}
              onSelect={selectCharacter}
              onFavorite={toggleSelectedFavorite}
              onLoadMore={characters.loadMore}
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
