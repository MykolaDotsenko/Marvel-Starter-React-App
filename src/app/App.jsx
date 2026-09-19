import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Header } from "../components/Header.jsx";
import { IssueDetail } from "../components/IssueDetail.jsx";
import { IssueGrid } from "../components/IssueGrid.jsx";
import { ReadingListPanel } from "../components/ReadingListPanel.jsx";
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
    eyebrow: "Discovery queue",
    title: "Latest indexed issues",
    emptyTitle: "No issues matched this search.",
    emptyDescription: "Try a broader title or one of the quick searches above.",
  },
  saved: {
    eyebrow: "Local shortlist",
    title: "Saved issues",
    emptyTitle: "Your saved shelf is empty.",
    emptyDescription: "Save useful issues from Explore or a dossier and they will stay here.",
  },
  reading: {
    eyebrow: "Personal journey",
    title: "Reading list",
    emptyTitle: "",
    emptyDescription: "",
  },
  recent: {
    eyebrow: "Local history",
    title: "Recently viewed",
    emptyTitle: "No recent issues yet.",
    emptyDescription: "Open an issue dossier and it will appear here automatically.",
  },
};

const App = () => {
  const [urlState, setUrlState] = useUrlState();
  const [preferences, setPreferences] = useState(loadPreferences);

  const rememberViewedIssue = useCallback((issue) => {
    setPreferences((current) => rememberIssue(current, issue));
  }, []);

  const isExplore = urlState.view === "explore";
  const isReading = urlState.view === "reading";
  const issues = useIssueList(urlState.query, { enabled: isExplore });
  const detail = useIssueDetails(urlState.issueId, {
    onLoaded: rememberViewedIssue,
  });

  useEffect(() => {
    savePreferences(preferences);
  }, [preferences]);

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

  const activeIssues =
    urlState.view === "saved"
      ? preferences.saved
      : urlState.view === "recent"
        ? preferences.recent
        : issues.items;

  const copy = viewCopy[urlState.view];
  const title =
    isExplore && urlState.query
      ? `Issues matching “${urlState.query}”`
      : copy.title;

  const selectedReadingEntry = urlState.issueId
    ? preferences.readingList.find((item) => item.issue.id === urlState.issueId)
    : null;

  const meta = isReading
    ? `${preferences.readingList.length} queued`
    : isExplore && issues.loading
      ? "Loading issues…"
      : isExplore && urlState.query
        ? `${activeIssues.length} search results shown`
        : isExplore && issues.total
          ? `${activeIssues.length} shown · ${issues.total.toLocaleString()} indexed`
          : `${activeIssues.length} shown`;

  return (
    <div className="app-shell">
      <Header
        activeView={urlState.view}
        savedCount={preferences.saved.length}
        readingCount={preferences.readingList.length}
        recentCount={preferences.recent.length}
        onViewChange={changeView}
      />

      <main id="main-content">
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero__copy">
            <p className="eyebrow">Marvel Reading Atlas / reading intelligence</p>
            <h1 id="hero-title">
              Turn Marvel discovery into a reading plan you can finish.
            </h1>
            <p className="hero__lede">
              Search tens of thousands of issues, inspect creator and series
              metadata, build an ordered reading journey, and track progress
              locally with no account.
            </p>
          </div>

          <div className="hero__metrics" aria-label="Product capabilities">
            <div><strong>37.5k+</strong><span>indexed comic issues</span></div>
            <div><strong>200</strong><span>bounded reading-list items</span></div>
            <div><strong>0</strong><span>auth or runtime UI libraries</span></div>
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
            ) : (
              <IssueGrid
                issues={activeIssues}
                selectedId={urlState.issueId}
                savedIds={savedIds}
                readingIds={readingIds}
                loading={isExplore ? issues.loading : false}
                loadingMore={isExplore ? issues.loadingMore : false}
                error={isExplore ? issues.error : null}
                ended={isExplore ? issues.ended : true}
                onSelect={selectIssue}
                onSaved={(issue) =>
                  setPreferences((current) => toggleSaved(current, issue))
                }
                onReading={(issue) =>
                  setPreferences((current) => toggleReadingItem(current, issue))
                }
                onLoadMore={isExplore ? issues.loadMore : undefined}
                onRetryInitial={isExplore ? issues.retryInitial : undefined}
                showPagination={isExplore && !urlState.query}
                emptyTitle={copy.emptyTitle}
                emptyDescription={copy.emptyDescription}
              />
            )}
          </section>

          <aside className="detail-rail" aria-label="Issue reading intelligence">
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
