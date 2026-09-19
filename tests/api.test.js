import { afterEach, describe, expect, it, vi } from "vitest";
import {
  clearMarvelCache,
  getMarvelCacheSize,
  listCharacters,
} from "../src/api/marvelClient.js";

const rawCharacter = {
  id: 1009610,
  name: "Spider-Man",
  description: "Friendly neighborhood hero.",
  thumbnail: {
    path: "https://images.example.test/spider-man",
    extension: "jpg",
  },
  comics: { available: 1, items: [] },
  series: { available: 1 },
  stories: { available: 1 },
  urls: [],
};

const response = () => ({
  ok: true,
  json: async () => ({
    data: {
      results: [rawCharacter],
    },
  }),
});

afterEach(() => {
  clearMarvelCache();
  vi.unstubAllGlobals();
});

describe("Marvel API cache", () => {
  it("calls the public Marvel API directly without private-key signing", async () => {
    const fetchMock = vi.fn(async () => response());
    vi.stubGlobal("fetch", fetchMock);

    await listCharacters({ query: "Spider" });

    const requestUrl = new URL(fetchMock.mock.calls[0][0].toString());

    expect(requestUrl.origin).toBe("https://gateway.marvel.com");
    expect(requestUrl.pathname).toBe("/v1/public/characters");
    expect(requestUrl.searchParams.get("nameStartsWith")).toBe("Spider");
    expect(requestUrl.searchParams.get("apikey")).toBeTruthy();
    expect(requestUrl.searchParams.has("hash")).toBe(false);
    expect(requestUrl.searchParams.has("ts")).toBe(false);
  });

  it("reuses a fresh response for an identical request", async () => {
    const fetchMock = vi.fn(async () => response());
    vi.stubGlobal("fetch", fetchMock);

    await listCharacters({ query: "Spider" });
    await listCharacters({ query: "Spider" });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(getMarvelCacheSize()).toBe(1);
  });

  it("evicts least-recently-used entries instead of growing without bound", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => response()));

    for (let index = 0; index < 55; index += 1) {
      await listCharacters({ query: `Character-${index}` });
    }

    expect(getMarvelCacheSize()).toBe(50);
  });
});
