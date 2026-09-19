import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AtlasRoutePanel } from "../components/AtlasRoutePanel.jsx";
import { Header } from "../components/Header.jsx";
import { IssueDetail } from "../components/IssueDetail.jsx";
import { IssueGrid } from "../components/IssueGrid.jsx";
import { MobileNav } from "../components/MobileNav.jsx";
import { ReadingListPanel } from "../components/ReadingListPanel.jsx";
import { RecentTimeline } from "../components/RecentTimeline.jsx";
import { SavedShelf } from "../components/SavedShelf.jsx";
import { SearchPanel } from "../components/SearchPanel.jsx";
import { useIssueDetails } from "../hooks/useIssueDetails.js";
import { useIssueList } from "../hooks/useIssueList.js";
import { useUrlState } from "../hooks/useUrlState.js";
import {
  loadPreferences,
  moveReadingItem,
  rememberIssue,
  savePreferences,
  setReadingStatus,
  toggleReadingItem,
  toggleSaved,
} from "../storage/preferences.js";

const quickSearches = ["Secret Wars", "Avengers", "X-Men", "Spider-Man", "Daredevil"];

const viewCopy = {
  explore: {
    eyebrow: "Discovery index",
    title: "Latest indexed issues",
  },
  saved: {
    eyebrow: "Saved shelf",
    title: "Issues worth returning to",
  },
  reading: {
    eyebrow: "Reading journey",
    title: "Your route through Marvel",
  },
  recent: {
    eyebrow: "Exploration trail",
    title: "Recently opened dossiers",
  },
};

const App = () => {
  const [urlState, setUrlState] = useUrlState();
  const [preferences, setPreferences] = useState(loadPreferences);
  const [showCompactSearch, setShowCompactSearch] = useState(false);
  const heroSearchRef = useRef(null);

  const rememberViewedIssue = useCallback((issue) => {
    setPreferences((current) => rememberIssue(current, issue));
  }, []);

  const isExplore = urlState.view === "explore";
  const isSaved = urlState.view === "saved";
  const isReading = urlState.view === "reading";
  const isRecent = urlState.view === "recent";
  const isCompactHero = Boolean(
    urlState.query || urlState.issueId || urlState.view !== "explore",
  );

  const issues = useIssueList(urlState.query, { enabled: isExplore });
  const detail = useIssueDetails(urlState.issueId, {
    onLoaded: rememberViewedIssue,
  });

  useEffect(() => {
    savePreferences(preferences);
  }, [preferences]);

  useEffect(() => {
    const heroSearch = heroSearchRef.current;

    if (!heroSearch || typeof IntersectionObserver === "undefined") {
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        const passedHeader =
          !entry.isIntersecting && entry.boundingClientRect.bottom <= 84;
        setShowCompactSearch(passedHeader);
      },
      {
        rootMargin: "-84px 0px 0px 0px",
        threshold: 0,
      },
    );

    observer.observe(heroSearch);
    return () => observer.disconnect();
  }, []);

  const savedIds = useMemo(
    () => new Set(preferences.saved.map((issue) => issue.id)),
    [preferences.saved],
  );
  const readingIds = useMemo(
    () => new Set(preferences.readingList.map((item) => item.issue.id)),
    [preferences.readingList],
  );

  const submitSearch = (query) => {
    startTransition(() => {
      setUrlState({ query, issueId: null, view: "explore" });
    });
  };

  const selectIssue = (issueId) => {
    startTransition(() => setUrlState({ issueId }));
  };

  const changeView = (view) => {
    startTransition(() => setUrlState({ view }));
  };

  const focusPrimarySearch = () => {
    const input = document.getElementById("issue-search");
    if (!input) return;

    input.scrollIntoView({ behavior: "smooth", block: "center" });
    window.setTimeout(() => input.focus({ preventScroll: true }), 250);
  };

  const copy = viewCopy[urlState.view];
  const title =
    isExplore && urlState.query
      ? `Issues matching “${urlState.query}”`
      : copy.title;

  const selectedReadingEntry = urlState.issueId
    ? preferences.readingList.find((item) => item.issue.id === urlState.issueId)
    : null;

  const visibleCount = isSaved
    ? preferences.saved.length
    : isRecent
      ? preferences.recent.length
      : isReading
        ? preferences.readingList.length
        : issues.items.length;

  const meta = isReading
    ? `${preferences.readingList.filter((item) => item.read).length}/${preferences.readingList.length} completed`
    : isExplore && issues.loading
      ? "Loading issues…"
      : isExplore && urlState.query
        ? `${issues.items.length} search results shown`
        : isExplore && issues.total
          ? `${issues.items.length} shown · ${issues.total.toLocaleString()} indexed`
          : `${visibleCount} shown`;

  return (
    <div className="app-shell">
      <Header
        activeView={urlState.view}
        activeQuery={urlState.query}
        savedCount={preferences.saved.length}
        readingCount={preferences.readingList.length}
        recentCount={preferences.recent.length}
        showCompactSearch={showCompactSearch}
        onSearch={submitSearch}
        onMobileSearch={focusPrimarySearch}
        onViewChange={changeView}
      />

      <main id="main-content">
        <section
          className={`hero${isCompactHero ? " hero--compact" : ""}`}
          aria-labelledby="hero-title"
        >
          <div className="hero__content">
            <div className="hero__copy">
              <p className="eyebrow">Marvel Reading Atlas / reading intelligence</p>

              {isCompactHero ? (
                <h1 id="hero-title" className="hero-title hero-title--compact">
                  Find the next issue on your route.
                </h1>
              ) : (
                <h1
                  id="hero-title"
                  className="hero-title hero-title--editorial"
                  aria-label="Build a Marvel reading journey you’ll actually finish."
                >
                  <span className="hero-title__line">Build a Marvel</span>
                  <span className="hero-title__line hero-title__journey">
                    <span>reading journey</span>
                  </span>
                  <span className="hero-title__line hero-title__finish">
                    you’ll actually finish.
                  </span>
                </h1>
              )}

              <p className="hero__lede">
                {isCompactHero
                  ? "Search the archive, inspect a dossier, then keep only what belongs in your journey."
                  : "Explore Marvel issues, inspect creator context, and turn discoveries into an ordered reading journey — no account required."}
              </p>
            </div>

            <div ref={heroSearchRef} className="hero__search-anchor">
              <SearchPanel
                key={urlState.query}
                activeQuery={urlState.query}
                onSubmit={submitSearch}
                quickSearches={quickSearches}
              />
            </div>
          </div>

          {isCompactHero ? null : <AtlasRoutePanel />}
        </section>

        <div className="workspace">
          <section className="explorer" aria-labelledby="explorer-title">
            <div className="section-heading">
              <div>
                <p className="eyebrow">{copy.eyebrow}</p>
                <h2 id="explorer-title">{title}</h2>
              </div>
              <p className="section-heading__meta" aria-live="polite">{meta}</p>
            </div>

            {isReading ? (
              <ReadingListPanel
                items={preferences.readingList}
                selectedId={urlState.issueId}
                onOpen={selectIssue}
                onMarkRead={(issueId, read) =>
                  setPreferences((current) => setReadingStatus(current, issueId, read))
                }
                onMove={(issueId, direction) =>
                  setPreferences((current) => moveReadingItem(current, issueId, direction))
                }
                onRemove={(issue) =>
                  setPreferences((current) => toggleReadingItem(current, issue))
                }
              />
            ) : isSaved ? (
              <SavedShelf
                issues={preferences.saved}
                selectedId={urlState.issueId}
                readingIds={readingIds}
                onOpen={selectIssue}
                onSaved={(issue) =>
                  setPreferences((current) => toggleSaved(current, issue))
                }
                onReading={(issue) =>
                  setPreferences((current) => toggleReadingItem(current, issue))
                }
              />
            ) : isRecent ? (
              <RecentTimeline
                entries={preferences.recent}
                selectedId={urlState.issueId}
                savedIds={savedIds}
                readingIds={readingIds}
                onOpen={selectIssue}
                onSaved={(issue) =>
                  setPreferences((current) => toggleSaved(current, issue))
                }
                onReading={(issue) =>
                  setPreferences((current) => toggleReadingItem(current, issue))
                }
              />
            ) : (
              <IssueGrid
                issues={issues.items}
                selectedId={urlState.issueId}
                savedIds={savedIds}
                readingIds={readingIds}
                loading={issues.loading}
                loadingMore={issues.loadingMore}
                error={issues.error}
                ended={urlState.query ? true : issues.ended}
                onSelect={selectIssue}
                onSaved={(issue) =>
                  setPreferences((current) => toggleSaved(current, issue))
                }
                onReading={(issue) =>
                  setPreferences((current) => toggleReadingItem(current, issue))
                }
                onLoadMore={issues.loadMore}
                onRetryInitial={issues.retryInitial}
              />
            )}
          </section>

          <aside
            className={`detail-rail${urlState.issueId ? " detail-rail--open" : ""}`}
            aria-label="Issue reading intelligence"
          >
            <IssueDetail
              issueId={urlState.issueId}
              issue={detail.issue}
              loading={detail.loading}
              error={detail.error}
              saved={urlState.issueId ? savedIds.has(urlState.issueId) : false}
              readingEntry={selectedReadingEntry}
              readingCount={preferences.readingList.length}
              onSaved={(issue) =>
                setPreferences((current) => toggleSaved(current, issue))
              }
              onReading={(issue) =>
                setPreferences((current) => toggleReadingItem(current, issue))
              }
              onReadToggle={(issueId, read) =>
                setPreferences((current) => setReadingStatus(current, issueId, read))
              }
              onClose={() => setUrlState({ issueId: null })}
            />
          </aside>
        </div>
      </main>

      <MobileNav
        activeView={urlState.view}
        savedCount={preferences.saved.length}
        readingCount={preferences.readingList.length}
        recentCount={preferences.recent.length}
        onViewChange={changeView}
      />

      <footer className="site-footer">
        <p>
          Metadata from the community-maintained Marvel Metadata API. Unofficial
          portfolio project; not affiliated with Marvel Entertainment. No comic
          content, accounts, analytics, cookies, or tracking.
        </p>
      </footer>
    </div>
  );
};

export default App;
