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
const REQUEST_TIMEOUT_MS = 10_000;

const responseCache = new Map();

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
  const cached = responseCache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

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

    responseCache.set(cacheKey, {
      value: results,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });

    return results;
  } finally {
    requestSignal.cleanup();
  }
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
  if (!Number.isInteger(Number(id))) {
    throw new TypeError("Character id must be an integer.");
  }

  const results = await request(`characters/${Number(id)}`, {}, signal);

  if (!results[0]) {
    throw new Error("Character was not found.");
  }

  return normalizeCharacter(results[0]);
};

export const getCharacterComics = async (id, { signal, limit = 8 } = {}) => {
  const results = await request(
    `characters/${Number(id)}/comics`,
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
