import {
  READING_LIST_LIMIT,
  RECENT_LIMIT,
  SAVED_LIMIT,
  normalizeIssueSummary,
  toIssueSnapshot,
} from "../domain/reading.js";

const STORAGE_KEY = "marvel-reading-atlas:library:v1";

const normalizeSnapshot = (value) => {
  try {
    return normalizeIssueSummary(value);
  } catch {
    return null;
  }
};

const normalizeIssueArray = (value, limit) => {
  if (!Array.isArray(value)) return [];

  const seen = new Set();
  const result = [];

  for (const raw of value) {
    const issue = normalizeSnapshot(raw);
    if (!issue || seen.has(issue.id)) continue;
    seen.add(issue.id);
    result.push(issue);
    if (result.length >= limit) break;
  }

  return result;
};

const normalizeRecentArray = (value) => {
  if (!Array.isArray(value)) return [];

  const seen = new Set();
  const result = [];

  for (const raw of value) {
    const issue = normalizeSnapshot(raw?.issue ?? raw);
    if (!issue || seen.has(issue.id)) continue;

    seen.add(issue.id);
    result.push({
      issue,
      viewedAt: Number.isFinite(raw?.viewedAt) ? raw.viewedAt : null,
    });

    if (result.length >= RECENT_LIMIT) break;
  }

  return result;
};

const normalizeReadingList = (value) => {
  if (!Array.isArray(value)) return [];

  const seen = new Set();
  const result = [];

  for (const raw of value) {
    const issue = normalizeSnapshot(raw?.issue);
    if (!issue || seen.has(issue.id)) continue;
    seen.add(issue.id);
    result.push({ issue, read: Boolean(raw.read) });
    if (result.length >= READING_LIST_LIMIT) break;
  }

  return result;
};

export const parsePreferences = (value) => {
  if (!value || typeof value !== "object") {
    return { saved: [], recent: [], readingList: [] };
  }

  return {
    saved: normalizeIssueArray(value.saved, SAVED_LIMIT),
    recent: normalizeRecentArray(value.recent),
    readingList: normalizeReadingList(value.readingList),
  };
};

export const loadPreferences = (storage = window.localStorage) => {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    return raw ? parsePreferences(JSON.parse(raw)) : parsePreferences(null);
  } catch {
    return parsePreferences(null);
  }
};

export const savePreferences = (preferences, storage = window.localStorage) => {
  const normalized = parsePreferences(preferences);

  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  } catch {
    // Local persistence is progressive enhancement; discovery still works.
  }

  return normalized;
};

export const toggleSaved = (preferences, issue) => {
  const snapshot = toIssueSnapshot(issue);
  const exists = preferences.saved.some((item) => item.id === snapshot.id);

  return {
    ...preferences,
    saved: exists
      ? preferences.saved.filter((item) => item.id !== snapshot.id)
      : [snapshot, ...preferences.saved].slice(0, SAVED_LIMIT),
  };
};

export const rememberIssue = (preferences, issue, viewedAt = Date.now()) => {
  const snapshot = toIssueSnapshot(issue);
  const next = {
    issue: snapshot,
    viewedAt,
  };

  return {
    ...preferences,
    recent: [
      next,
      ...preferences.recent.filter((entry) => entry.issue.id !== snapshot.id),
    ].slice(0, RECENT_LIMIT),
  };
};

export const toggleReadingItem = (preferences, issue) => {
  const snapshot = toIssueSnapshot(issue);
  const exists = preferences.readingList.some(
    (item) => item.issue.id === snapshot.id,
  );

  return {
    ...preferences,
    readingList: exists
      ? preferences.readingList.filter((item) => item.issue.id !== snapshot.id)
      : [...preferences.readingList, { issue: snapshot, read: false }].slice(
          0,
          READING_LIST_LIMIT,
        ),
  };
};

export const setReadingStatus = (preferences, issueId, read) => ({
  ...preferences,
  readingList: preferences.readingList.map((item) =>
    item.issue.id === issueId ? { ...item, read: Boolean(read) } : item,
  ),
});

export const moveReadingItem = (preferences, issueId, direction) => {
  const index = preferences.readingList.findIndex(
    (item) => item.issue.id === issueId,
  );
  const target = index + direction;

  if (
    index < 0 ||
    target < 0 ||
    target >= preferences.readingList.length ||
    ![-1, 1].includes(direction)
  ) {
    return preferences;
  }

  const readingList = [...preferences.readingList];
  [readingList[index], readingList[target]] = [
    readingList[target],
    readingList[index],
  ];

  return { ...preferences, readingList };
};
