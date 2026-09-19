import { describe, expect, it } from "vitest";
import {
  normalizeCharacter,
  normalizeComic,
  pushRecent,
  sanitizeSearchTerm,
  toggleId,
  uniqueById,
} from "../src/domain/marvel.js";

describe("Marvel domain", () => {
  it("normalizes character data and fixes insecure asset URLs", () => {
    const character = normalizeCharacter({
      id: 101,
      name: "  Storm  ",
      description: "",
      thumbnail: {
        path: "http://cdn.example.com/storm",
        extension: "jpg",
      },
      comics: {
        available: 12,
        items: [{ name: "X-Men #1" }],
      },
      series: { available: 4 },
      stories: { available: 9 },
      urls: [
        { type: "detail", url: "http://marvel.example.com/storm" },
        { type: "wiki", url: "https://marvel.example.com/wiki/storm" },
      ],
    });

    expect(character.name).toBe("Storm");
    expect(character.image).toBe("https://cdn.example.com/storm.jpg");
    expect(character.comics).toEqual([{ name: "X-Men #1" }]);
    expect(character.detailUrl).toMatch(/^https:/);
    expect(character.description).toMatch(/does not currently provide/i);
  });

  it("fixes the legacy comics-field regression by exposing comics consistently", () => {
    const character = normalizeCharacter({
      id: 7,
      name: "Nova",
      thumbnail: { path: "https://img.test/nova", extension: "jpg" },
      comics: { available: 1, items: [{ name: "Nova #1" }] },
      series: { available: 0 },
      stories: { available: 0 },
      urls: [],
    });

    expect(character.comics[0].name).toBe("Nova #1");
    expect(character).not.toHaveProperty("cocomics");
  });

  it("normalizes comics and chooses a positive price", () => {
    const comic = normalizeComic({
      id: 88,
      title: "  Secret Wars  ",
      thumbnail: { path: "http://img.test/secret", extension: "png" },
      prices: [{ price: 0 }, { price: 4.99 }],
      urls: [{ type: "detail", url: "https://marvel.test/comic" }],
      issueNumber: 2,
      pageCount: 32,
    });

    expect(comic.title).toBe("Secret Wars");
    expect(comic.price).toBe(4.99);
    expect(comic.image).toMatch(/^https:/);
  });

  it("keeps list helpers deterministic", () => {
    expect(uniqueById([{ id: 1 }, { id: 1 }, { id: 2 }])).toEqual([
      { id: 1 },
      { id: 2 },
    ]);
    expect(toggleId([2, 1], 2)).toEqual([1]);
    expect(toggleId([1], 2)).toEqual([2, 1]);
    expect(pushRecent([2, 1, 3], 1, 3)).toEqual([1, 2, 3]);
  });

  it("bounds and normalizes search input", () => {
    expect(sanitizeSearchTerm("   Spider    Man   ")).toBe("Spider Man");
    expect(sanitizeSearchTerm("x".repeat(120))).toHaveLength(80);
  });
});
