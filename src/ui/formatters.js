const fullDateFormatter = new Intl.DateTimeFormat("en", {
  year: "numeric",
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

const compactDateFormatter = new Intl.DateTimeFormat("en", {
  year: "numeric",
  month: "short",
  day: "2-digit",
  timeZone: "UTC",
});

const parseDate = (value) => {
  if (!value) return null;

  const source = String(value).trim();
  const isoDay = source.match(/^\d{4}-\d{2}-\d{2}/)?.[0];
  const date = new Date(isoDay ? `${isoDay}T00:00:00Z` : source);

  return Number.isNaN(date.getTime()) ? null : date;
};

export const formatIssueDate = (value, { compact = false } = {}) => {
  const date = parseDate(value);
  if (!date) return "Date unavailable";

  return (compact ? compactDateFormatter : fullDateFormatter).format(date);
};

export const formatRecentTimestamp = (value, now = Date.now()) => {
  if (!Number.isFinite(value)) return "Previously viewed";

  const delta = Math.max(0, now - value);
  const minutes = Math.floor(delta / 60_000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  return fullDateFormatter.format(new Date(value));
};
