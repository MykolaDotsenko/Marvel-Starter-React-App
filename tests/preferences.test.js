import { describe, expect, it } from "vitest";
import {
  loadPreferences,
  parsePreferences,
  rememberCharacter,
  savePreferences,
  toggleFavorite,
} from "../src/storage/preferences.js";

const createStorage = (initial = {}) => {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
  };
};

describe("preferences storage", () => {
  it("normalizes duplicate and invalid ids", () => {
    expect(
      parsePreferences({
        favorites: [7, 7, "9", 12],
        recent: [12, 7, 12, null],
      }),
    ).toEqual({
      favorites: [7, 12],
      recent: [12, 7],
    });
  });

  it("recovers from corrupted JSON", () => {
    const storage = createStorage({
      "marvel-atlas:preferences:v1": "{broken",
    });
    expect(loadPreferences(storage)).toEqual({ favorites: [], recent: [] });
  });

  it("persists only normalized durable state", () => {
    const storage = createStorage();
    const saved = savePreferences(
      { favorites: [3, 3, 4], recent: [4, 3] },
      storage,
    );

    expect(saved).toEqual({ favorites: [3, 4], recent: [4, 3] });
  });

  it("updates favorites and recents without mutating the input", () => {
    const start = { favorites: [1], recent: [2] };
    expect(toggleFavorite(start, 3)).toEqual({
      favorites: [3, 1],
      recent: [2],
    });
    expect(rememberCharacter(start, 5)).toEqual({
      favorites: [1],
      recent: [5, 2],
    });
    expect(start).toEqual({ favorites: [1], recent: [2] });
  });
});
