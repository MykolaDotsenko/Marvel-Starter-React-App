import { describe, expect, it } from "vitest";
import {
  normalizeHttpsUrl,
  normalizeIssueDetail,
  normalizeIssueSummary,
  normalizeViewMode,
  sanitizeSearchTerm,
  uniqueById,
} from "../src/domain/reading.js";

describe("Marvel reading domain", () => {
  it("normalizes issue details and upgrades insecure cover URLs", () => {
    const issue = normalizeIssueDetail({
      id: 52447,
      title: "  Secret Wars (2015) #1  ",
      issueNumber: "1",
      detailUrl: "http://www.marvel.com/comics/issue/52447",
      seriesId: 19684,
      seriesName: "Secret Wars (2015 - 2016)",
      onSaleDate: "2015-05-06",
      unlimitedDate: "2015-11-04",
      pageCount: 48,
      creators: [{ id: 11743, name: "Jonathan Hickman", role: "writer" }],
      cover: { path: "http://images.example.test/secret-wars", extension: "jpg" },
    });

    expect(issue.title).toBe("Secret Wars (2015) #1");
    expect(issue.cover).toBe("https://images.example.test/secret-wars.jpg");
    expect(issue.detailUrl).toMatch(/^https:/);
    expect(issue.creators[0].name).toBe("Jonathan Hickman");
    expect(issue.isUnlimited).toBe(true);
    expect(issue.year).toBe(2015);
  });

  it("rejects unsafe external protocols", () => {
    const issue = normalizeIssueSummary({
      id: 9,
      title: "Unsafe issue",
      detailUrl: "javascript:alert(1)",
      cover: { path: "javascript:alert(1)", extension: "jpg" },
    });
    expect(issue.detailUrl).toBeNull();
    expect(issue.cover).toBeNull();
    expect(normalizeHttpsUrl("data:text/html,test")).toBeNull();
  });

  it("keeps comic issue suffixes as text", () => {
    expect(
      normalizeIssueSummary({ id: 10, title: "Avengers #24.NOW", issueNumber: "24.NOW" }).issueNumber,
    ).toBe("24.NOW");
  });

  it("keeps list helpers deterministic", () => {
    expect(uniqueById([{ id: 1 }, { id: 1 }, { id: 2 }])).toEqual([{ id: 1 }, { id: 2 }]);
  });

  it("bounds search input and rejects unknown views", () => {
    expect(sanitizeSearchTerm("   Secret    Wars   ")).toBe("Secret Wars");
    expect(sanitizeSearchTerm("x".repeat(120))).toHaveLength(80);
    expect(normalizeViewMode("reading")).toBe("reading");
    expect(normalizeViewMode("anything-else")).toBe("explore");
  });
});
