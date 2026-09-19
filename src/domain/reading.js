export const ISSUE_PAGE_SIZE = 12;
export const SEARCH_LIMIT = 48;
export const SAVED_LIMIT = 50;
export const RECENT_LIMIT = 8;
export const READING_LIST_LIMIT = 200;
export const VIEW_MODES = ["explore", "saved", "reading", "recent"];

const DESCRIPTION_FALLBACK =
  "No description is currently available for this issue.";

const safeText = (value) => (typeof value === "string" ? value.trim() : "");

export const normalizeHttpsUrl = (value) => {
  const candidate = safeText(value);
  if (!candidate) return null;

  try {
    const parsed = new URL(candidate.replace(/^http:/, "https:"));
    return parsed.protocol === "https:" ? parsed.toString() : null;
  } catch {
    return null;
  }
};

const normalizeCover = (cover) => {
  const path = safeText(cover?.path);
  const extension = safeText(cover?.extension);

  if (!path) return null;
  return normalizeHttpsUrl(extension ? `${path}.${extension}` : path);
};

const normalizeIssueNumber = (value) => {
  if (value === null || value === undefined) return null;
  const normalized = String(value).trim();
  return normalized || null;
};

const inferYear = (raw) => {
  if (Number.isInteger(raw?.yearPage)) return raw.yearPage;
  const value = safeText(raw?.onSaleDate);
  const year = Number(value.slice(0, 4));
  return Number.isInteger(year) && year > 1900 ? year : null;
};

export const sanitizeSearchTerm = (value) =>
  safeText(value).replace(/\s+/g, " ").slice(0, 80);

export const normalizeViewMode = (value) =>
  VIEW_MODES.includes(value) ? value : "explore";

export const normalizeIssueSummary = (raw) => {
  if (!raw || !Number.isInteger(raw.id) || raw.id <= 0 || !safeText(raw.title)) {
    throw new TypeError("Invalid Marvel issue payload.");
  }

  return {
    id: raw.id,
    title: safeText(raw.title),
    issueNumber: normalizeIssueNumber(raw.issueNumber),
    detailUrl: normalizeHttpsUrl(raw.detailUrl),
    seriesId:
      Number.isInteger(raw.seriesId) && raw.seriesId > 0 ? raw.seriesId : null,
    seriesName: safeText(raw.seriesName) || "Unknown series",
    onSaleDate: safeText(raw.onSaleDate) || null,
    unlimitedDate: safeText(raw.unlimitedDate) || null,
    year: inferYear(raw),
    isUnlimited: Boolean(safeText(raw.unlimitedDate)),
    cover: normalizeCover(raw.cover),
  };
};

export const normalizeIssueDetail = (raw) => {
  const summary = normalizeIssueSummary(raw);
  const creators = Array.isArray(raw.creators)
    ? raw.creators
        .filter(
          (creator) =>
            Number.isInteger(creator?.id) &&
            creator.id > 0 &&
            safeText(creator?.name),
        )
        .map((creator) => ({
          id: creator.id,
          name: safeText(creator.name),
          role: safeText(creator.role) || "creator",
        }))
    : [];

  return {
    ...summary,
    description: safeText(raw.description) || DESCRIPTION_FALLBACK,
    pageCount:
      Number.isInteger(raw.pageCount) && raw.pageCount > 0
        ? raw.pageCount
        : null,
    digitalId:
      Number.isInteger(raw.digitalId) && raw.digitalId > 0
        ? raw.digitalId
        : null,
    modified: safeText(raw.modified) || null,
    creators,
    cover: normalizeCover(raw.cover),
  };
};

export const toIssueSnapshot = (issue) => normalizeIssueSummary(issue);

export const uniqueById = (items) => {
  const seen = new Set();
  return items.filter((item) => {
    if (!item || seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
};
