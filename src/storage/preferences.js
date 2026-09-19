import { RECENT_LIMIT, pushRecent, toggleId } from "../domain/marvel.js";

const STORAGE_KEY = "marvel-atlas:preferences:v1";

const normalizeIds = (value, limit = 50) =>
  Array.isArray(value)
    ? [...new Set(value.filter(Number.isInteger))].slice(0, limit)
    : [];

export const parsePreferences = (value) => {
  if (!value || typeof value !== "object") {
    return { favorites: [], recent: [] };
  }

  return {
    favorites: normalizeIds(value.favorites),
    recent: normalizeIds(value.recent, RECENT_LIMIT),
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
    // Storage is an enhancement. The product continues to work in-memory.
  }
  return normalized;
};

export const toggleFavorite = (preferences, id) => ({
  ...preferences,
  favorites: toggleId(preferences.favorites, id),
});

export const rememberCharacter = (preferences, id) => ({
  ...preferences,
  recent: pushRecent(preferences.recent, id),
});
