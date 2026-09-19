import {
  CHARACTER_PAGE_SIZE,
  normalizeCharacter,
  normalizeComic,
  sanitizeSearchTerm,
} from "../domain/marvel.js";

const API_BASE = "https://gateway.marvel.com/v1/public";
const PUBLIC_KEY =
  import.meta.env.VITE_MARVEL_PUBLIC_KEY ||
  "6f00fba70811bdd9daa3cf27662d5b52";
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
  if (responseCache.has(key)) {
    responseCache.delete(key);
  }

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

const request = async (pathname, params = {}, externalSignal) => {
  const url = new URL(`${API_BASE}/${pathname}`);
  url.searchParams.set("apikey", PUBLIC_KEY);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });

  const cacheKey = url.toString();
  const cached = readCache(cacheKey);
  if (cached) return cached;

  const requestSignal = createRequestSignal(externalSignal);

  try {
    const response = await fetch(url, {
      signal: requestSignal.signal,
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error(`Marvel API request failed with status ${response.status}.`);
    }

    const payload = await response.json();
    const results = payload?.data?.results;

    if (!Array.isArray(results)) {
      throw new TypeError("Marvel API returned an unexpected payload.");
    }

    writeCache(cacheKey, results);
    return results;
  } finally {
    requestSignal.cleanup();
  }
};

const normalizeId = (id) => {
  const value = Number(id);
  if (!Number.isInteger(value) || value <= 0) {
    throw new TypeError("Character id must be a positive integer.");
  }
  return value;
};

export const listCharacters = async ({
  query = "",
  offset = 0,
  limit = CHARACTER_PAGE_SIZE,
  signal,
} = {}) => {
  const normalizedQuery = sanitizeSearchTerm(query);
  const results = await request(
    "characters",
    {
      limit,
      offset,
      orderBy: "name",
      ...(normalizedQuery ? { nameStartsWith: normalizedQuery } : {}),
    },
    signal,
  );

  return results.map(normalizeCharacter);
};

export const getCharacter = async (id, { signal } = {}) => {
  const characterId = normalizeId(id);
  const results = await request(`characters/${characterId}`, {}, signal);

  if (!results[0]) {
    throw new Error("Character was not found.");
  }

  return normalizeCharacter(results[0]);
};

export const getCharacterComics = async (id, { signal, limit = 8 } = {}) => {
  const characterId = normalizeId(id);
  const results = await request(
    `characters/${characterId}/comics`,
    {
      limit,
      orderBy: "-onsaleDate",
      formatType: "comic",
      noVariants: true,
    },
    signal,
  );

  return results
    .map((comic) => {
      try {
        return normalizeComic(comic);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
};

export const clearMarvelCache = () => responseCache.clear();

export const getMarvelCacheSize = () => responseCache.size;
