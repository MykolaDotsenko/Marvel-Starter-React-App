import { afterEach, describe, expect, it, vi } from "vitest";
import {
  clearMetadataCache,
  getMetadataCacheSize,
  listIssues,
  searchIssues,
} from "../src/api/marvelMetadataClient.js";

const rawIssue = {
  id: 52447,
  title: "Secret Wars (2015) #1",
  issueNumber: "1",
  detailUrl: "https://www.marvel.com/comics/issue/52447",
  seriesId: 19684,
  seriesName: "Secret Wars (2015 - 2016)",
  onSaleDate: "2015-05-06",
  unlimitedDate: "2015-11-04",
  yearPage: 2015,
};

const response = (payload) => ({ ok: true, status: 200, json: async () => payload });

afterEach(() => {
  clearMetadataCache();
  vi.unstubAllGlobals();
});

describe("Marvel Metadata API client", () => {
  it("uses the no-auth community metadata endpoint", async () => {
    const fetchMock = vi.fn(async () =>
      response({ items: [rawIssue], total: 1, limit: 12, offset: 0, has_next: false }),
    );
    vi.stubGlobal("fetch", fetchMock);
    await listIssues();

    const requestUrl = new URL(fetchMock.mock.calls[0][0].toString());
    expect(requestUrl.origin).toBe("https://marvel.emreparker.com");
    expect(requestUrl.pathname).toBe("/v1/issues");
    expect(requestUrl.searchParams.get("limit")).toBe("12");
    expect(requestUrl.searchParams.has("apikey")).toBe(false);
  });

  it("uses the documented full-text search endpoint", async () => {
    const fetchMock = vi.fn(async () =>
      response({ query: "Secret Wars", items: [rawIssue], count: 1 }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const result = await searchIssues("  Secret   Wars ");

    const requestUrl = new URL(fetchMock.mock.calls[0][0].toString());
    expect(requestUrl.pathname).toBe("/v1/search/issues");
    expect(requestUrl.searchParams.get("q")).toBe("Secret Wars");
    expect(result.items[0].title).toContain("Secret Wars");
  });

  it("reuses a fresh identical response", async () => {
    const fetchMock = vi.fn(async () =>
      response({ query: "Secret Wars", items: [rawIssue], count: 1 }),
    );
    vi.stubGlobal("fetch", fetchMock);
    await searchIssues("Secret Wars");
    await searchIssues("Secret Wars");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(getMetadataCacheSize()).toBe(1);
  });

  it("evicts least-recently-used responses", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => response({ query: "x", items: [rawIssue], count: 1 })));
    for (let index = 0; index < 55; index += 1) {
      await searchIssues(`Issue ${index}`);
    }
    expect(getMetadataCacheSize()).toBe(50);
  });
});
