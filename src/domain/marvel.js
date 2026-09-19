export const CHARACTER_PAGE_SIZE = 12;
export const RECENT_LIMIT = 6;
export const FAVORITES_LIMIT = 50;
export const COLLECTION_LIMIT = 24;
export const VIEW_MODES = ["explore", "saved", "recent"];

const DESCRIPTION_FALLBACK =
  "Marvel does not currently provide a description for this character.";

const safeText = (value) => (typeof value === "string" ? value.trim() : "");

const normalizeHttpsUrl = (value) => {
  const candidate = safeText(value);
  if (!candidate) return null;

  try {
    const parsed = new URL(candidate.replace(/^http:/, "https:"));
    return parsed.protocol === "https:" ? parsed.toString() : null;
  } catch {
    return null;
  }
};

const normalizeImage = (thumbnail) => {
  const path = safeText(thumbnail?.path);
  const extension = safeText(thumbnail?.extension);

  if (!path || !extension) return null;
  return normalizeHttpsUrl(`${path}.${extension}`);
};

export const sanitizeSearchTerm = (value) =>
  safeText(value).replace(/\s+/g, " ").slice(0, 80);

export const normalizeViewMode = (value) =>
  VIEW_MODES.includes(value) ? value : "explore";

export const normalizeCharacter = (raw) => {
  if (!raw || !Number.isInteger(raw.id) || !safeText(raw.name)) {
    throw new TypeError("Invalid Marvel character payload.");
  }

  const imagePath = safeText(raw.thumbnail?.path);
  const urls = Array.isArray(raw.urls) ? raw.urls : [];
  const findUrl = (type) =>
    normalizeHttpsUrl(urls.find((entry) => entry?.type === type)?.url);

  return {
    id: raw.id,
    name: safeText(raw.name),
    description: safeText(raw.description) || DESCRIPTION_FALLBACK,
    image: normalizeImage(raw.thumbnail),
    hasPlaceholderImage: imagePath.includes("image_not_available"),
    comics:
      raw.comics?.items
        ?.filter((item) => safeText(item?.name))
        .slice(0, 20)
        .map((item) => ({ name: safeText(item.name) })) ?? [],
    comicCount: Number.isFinite(raw.comics?.available) ? raw.comics.available : 0,
    seriesCount: Number.isFinite(raw.series?.available) ? raw.series.available : 0,
    storiesCount: Number.isFinite(raw.stories?.available) ? raw.stories.available : 0,
    detailUrl: findUrl("detail"),
    wikiUrl: findUrl("wiki"),
  };
};

export const normalizeComic = (raw) => {
  if (!raw || !Number.isInteger(raw.id) || !safeText(raw.title)) {
    throw new TypeError("Invalid Marvel comic payload.");
  }

  const price =
    raw.prices?.find((entry) => Number(entry?.price) > 0)?.price ?? null;

  return {
    id: raw.id,
    title: safeText(raw.title),
    description: safeText(raw.description),
    issueNumber: Number.isFinite(raw.issueNumber) ? raw.issueNumber : null,
    pageCount: Number.isFinite(raw.pageCount) ? raw.pageCount : null,
    image: normalizeImage(raw.thumbnail),
    price,
    detailUrl: normalizeHttpsUrl(
      Array.isArray(raw.urls)
        ? raw.urls.find((entry) => entry?.type === "detail")?.url
        : null,
    ),
  };
};

export const uniqueById = (items) => {
  const seen = new Set();
  return items.filter((item) => {
    if (!item || seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
};

export const toggleId = (ids, id, limit = FAVORITES_LIMIT) => {
  if (ids.includes(id)) {
    return ids.filter((value) => value !== id);
  }
  return [id, ...ids].slice(0, limit);
};

export const pushRecent = (ids, id, limit = RECENT_LIMIT) =>
  [id, ...ids.filter((value) => value !== id)].slice(0, limit);
