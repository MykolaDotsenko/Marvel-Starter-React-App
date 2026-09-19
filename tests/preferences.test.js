import { describe, expect, it } from "vitest";
import {
  loadPreferences,
  moveReadingItem,
  parsePreferences,
  rememberIssue,
  savePreferences,
  setReadingStatus,
  toggleReadingItem,
  toggleSaved,
} from "../src/storage/preferences.js";

const issue = (id, title = `Issue ${id}`) => ({
  id,
  title,
  issueNumber: String(id),
  detailUrl: `https://example.test/issues/${id}`,
  seriesId: 1,
  seriesName: "Test Series",
  onSaleDate: "2026-01-01",
  unlimitedDate: null,
  year: 2026,
  isUnlimited: false,
  cover: null,
});

const createStorage = (initial = {}) => {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
  };
};

describe("reading library storage", () => {
  it("normalizes duplicates and malformed snapshots", () => {
    const result = parsePreferences({
      saved: [issue(1), issue(1), { id: "bad" }],
      recent: [issue(2), issue(2)],
      readingList: [
        { issue: issue(3), read: true },
        { issue: issue(3), read: false },
      ],
    });
    expect(result.saved).toHaveLength(1);
    expect(result.recent).toHaveLength(1);
    expect(result.readingList).toHaveLength(1);
    expect(result.readingList[0].read).toBe(true);
  });

  it("recovers from corrupted JSON", () => {
    const storage = createStorage({ "marvel-reading-atlas:library:v1": "{broken" });
    expect(loadPreferences(storage)).toEqual({ saved: [], recent: [], readingList: [] });
  });

  it("persists normalized durable state", () => {
    const storage = createStorage();
    const saved = savePreferences(
      {
        saved: [issue(1), issue(1)],
        recent: [issue(2)],
        readingList: [{ issue: issue(3), read: false }],
      },
      storage,
    );
    expect(saved.saved).toHaveLength(1);
    expect(saved.readingList[0].issue.id).toBe(3);
  });

  it("updates saved, recent and reading state immutably", () => {
    const start = { saved: [], recent: [], readingList: [] };
    const withSaved = toggleSaved(start, issue(1));
    const withRecent = rememberIssue(withSaved, issue(2));
    const withReading = toggleReadingItem(withRecent, issue(3));
    const read = setReadingStatus(withReading, 3, true);

    expect(read.saved[0].id).toBe(1);
    expect(read.recent[0].id).toBe(2);
    expect(read.readingList[0].read).toBe(true);
    expect(start).toEqual({ saved: [], recent: [], readingList: [] });
  });

  it("reorders reading items without mutation", () => {
    const start = {
      saved: [],
      recent: [],
      readingList: [
        { issue: issue(1), read: false },
        { issue: issue(2), read: false },
      ],
    };
    const moved = moveReadingItem(start, 2, -1);
    expect(moved.readingList.map((item) => item.issue.id)).toEqual([2, 1]);
    expect(start.readingList.map((item) => item.issue.id)).toEqual([1, 2]);
  });
});
