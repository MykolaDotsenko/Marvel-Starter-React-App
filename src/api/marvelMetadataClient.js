import {
  ISSUE_PAGE_SIZE,
  SEARCH_LIMIT,
  normalizeIssueDetail,
  normalizeIssueSummary,
  sanitizeSearchTerm,
} from "../domain/reading.js";

const API_BASE =
  import.meta.env.VITE_MARVEL_METADATA_API?.trim() ||
  "https://marvel.emreparker.com/v1";
const CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_CACHE_ENTRIES = 50;
const REQUEST_TIMEOUT_MS = 10_000;

const responseCache = new Map();

const readCache = (key) => {
  const cached = responseCache.get(key);
  if (!cached) return null;

  if (cached.expiresAt <= Date.now()) {
    responseCache.delete(key);
    return null;
  }

  responseCache.delete(key);
  responseCache.set(key, cached);
  return cached.value;
};

const writeCache = (key, value) => {
  if (responseCache.has(key)) responseCache.delete(key);

  while (responseCache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = responseCache.keys().next().value;
    responseCache.delete(oldestKey);
  }

  responseCache.set(key, {
    value,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
};

const createRequestSignal = (externalSignal) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(new DOMException("Request timed out", "TimeoutError")),
    REQUEST_TIMEOUT_MS,
  );

  const abortFromExternal = () => controller.abort(externalSignal?.reason);

  if (externalSignal) {
    if (externalSignal.aborted) {
      abortFromExternal();
    } else {
      externalSignal.addEventListener("abort", abortFromExternal, { once: true });
    }
  }

  return {
    signal: controller.signal,
    cleanup() {
      clearTimeout(timeoutId);
      externalSignal?.removeEventListener("abort", abortFromExternal);
    },
  };
};

const buildUrl = (pathname, params = {}) => {
  const url = new URL(`${API_BASE}/${pathname}`);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });

  return url;
};

const request = async (pathname, params = {}, externalSignal) => {
  const url = buildUrl(pathname, params);
  const cacheKey = url.toString();
  const cached = readCache(cacheKey);
  if (cached) return cached;

  const requestSignal = createRequestSignal(externalSignal);

  try {
    const response = await fetch(url, {
      signal: requestSignal.signal,
      headers: { Accept: "application/json" },
    });
    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      const message =
        typeof payload?.detail === "string" && payload.detail.trim()
          ? payload.detail.trim()
          : `Marvel metadata request failed with status ${response.status}.`;
      throw new Error(message);
    }

    if (!payload || typeof payload !== "object") {
      throw new TypeError("Marvel metadata API returned an unexpected payload.");
    }

    writeCache(cacheKey, payload);
    return payload;
  } finally {
    requestSignal.cleanup();
  }
};

const normalizeId = (id) => {
  const value = Number(id);
  if (!Number.isInteger(value) || value <= 0) {
    throw new TypeError("Issue id must be a positive integer.");
  }
  return value;
};

const normalizeList = (items) =>
  Array.isArray(items)
    ? items
        .map((item) => {
          try {
            return normalizeIssueSummary(item);
          } catch {
            return null;
          }
        })
        .filter(Boolean)
    : [];

export const listIssues = async ({
  offset = 0,
  limit = ISSUE_PAGE_SIZE,
  signal,
} = {}) => {
  const payload = await request("issues", { offset, limit }, signal);
  const items = normalizeList(payload.items);

  return {
    items,
    total: Number.isInteger(payload.total) ? payload.total : items.length,
    hasNext: Boolean(payload.has_next),
  };
};

export const searchIssues = async (
  query,
  { limit = SEARCH_LIMIT, signal } = {},
) => {
  const normalizedQuery = sanitizeSearchTerm(query);

  if (normalizedQuery.length < 2) {
    return { items: [], total: 0, hasNext: false };
  }

  const payload = await request(
    "search/issues",
    { q: normalizedQuery, limit },
    signal,
  );
  const items = normalizeList(payload.items);

  return {
    items,
    total: Number.isInteger(payload.count) ? payload.count : items.length,
    hasNext: false,
  };
};

export const getIssue = async (id, { signal } = {}) => {
  const issueId = normalizeId(id);
  const payload = await request(`issues/${issueId}`, {}, signal);
  return normalizeIssueDetail(payload);
};

export const clearMetadataCache = () => responseCache.clear();
export const getMetadataCacheSize = () => responseCache.size;
