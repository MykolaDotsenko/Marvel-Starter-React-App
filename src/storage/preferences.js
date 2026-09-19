import {
  FAVORITES_LIMIT,
  RECENT_LIMIT,
  pushRecent,
  toggleId,
} from "../domain/marvel.js";

const STORAGE_KEY = "marvel-atlas:preferences:v1";

const normalizeIds = (value, limit) =>
  Array.isArray(value)
    ? [...new Set(value.filter(Number.isInteger))].slice(0, limit)
    : [];

export const parsePreferences = (value) => {
  if (!value || typeof value !== "object") {
    return { favorites: [], recent: [] };
  }

  return {
    favorites: normalizeIds(value.favorites, FAVORITES_LIMIT),
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
    // Local persistence is an enhancement. Browsing remains fully functional.
  }

  return normalized;
};

export const toggleFavorite = (preferences, id) => ({
  ...preferences,
  favorites: toggleId(preferences.favorites, id),
});

export const rememberCharacter = (preferences, id) => {
  if (preferences.recent[0] === id) return preferences;

  return {
    ...preferences,
    recent: pushRecent(preferences.recent, id),
  };
};
