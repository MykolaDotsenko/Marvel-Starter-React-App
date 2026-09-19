import { describe, expect, it } from "vitest";
import {
  formatIssueDate,
  formatRecentTimestamp,
} from "../src/ui/formatters.js";

describe("editorial formatters", () => {
  it("renders provider timestamps as human-readable calendar dates", () => {
    expect(formatIssueDate("1984-05-10T00:00:00+0000")).toBe("May 10, 1984");
    expect(
      formatIssueDate("1984-05-10T00:00:00+0000", { compact: true }),
    ).toBe("May 10, 1984");
  });

  it("does not shift ISO day values through the local timezone", () => {
    expect(formatIssueDate("2015-05-06")).toBe("May 6, 2015");
  });

  it("falls back safely when dates are missing or malformed", () => {
    expect(formatIssueDate(null)).toBe("Date unavailable");
    expect(formatIssueDate("not-a-date")).toBe("Date unavailable");
  });

  it("renders recent timestamps without exposing raw milliseconds", () => {
    const now = 2_000_000;
    expect(formatRecentTimestamp(now - 30_000, now)).toBe("Just now");
    expect(formatRecentTimestamp(now - 5 * 60_000, now)).toBe("5m ago");
    expect(formatRecentTimestamp(null, now)).toBe("Previously viewed");
  });
});
