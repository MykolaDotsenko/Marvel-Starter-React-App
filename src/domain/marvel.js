export const CHARACTER_PAGE_SIZE = 12;
export const RECENT_LIMIT = 6;

const DESCRIPTION_FALLBACK =
  "Marvel does not currently provide a description for this character.";

const toHttps = (value = "") => value.replace(/^http:/, "https:");

const safeText = (value) => (typeof value === "string" ? value.trim() : "");

const normalizeUrl = (url) => {
  const candidate = safeText(url);
  if (!candidate) return null;

  try {
    const parsed = new URL(toHttps(candidate));
    return parsed.protocol === "https:" ? parsed.toString() : null;
  } catch {
    return null;
  }
};

export const sanitizeSearchTerm = (value) =>
  safeText(value).replace(/\s+/g, " ").slice(0, 80);

export const normalizeCharacter = (raw) => {
  if (!raw || !Number.isInteger(raw.id) || !safeText(raw.name)) {
    throw new TypeError("Invalid Marvel character payload.");
  }

  const imagePath = safeText(raw.thumbnail?.path);
  const imageExtension = safeText(raw.thumbnail?.extension);
  const image =
    imagePath && imageExtension ? toHttps(`${imagePath}.${imageExtension}`) : null;

  const urls = Array.isArray(raw.urls) ? raw.urls : [];
  const findUrl = (type) => normalizeUrl(urls.find((entry) => entry?.type === type)?.url);

  return {
    id: raw.id,
    name: safeText(raw.name),
    description: safeText(raw.description) || DESCRIPTION_FALLBACK,
    image,
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

  const imagePath = safeText(raw.thumbnail?.path);
  const imageExtension = safeText(raw.thumbnail?.extension);
  const price =
    raw.prices?.find((entry) => Number(entry?.price) > 0)?.price ?? null;

  return {
    id: raw.id,
    title: safeText(raw.title),
    description: safeText(raw.description),
    issueNumber: Number.isFinite(raw.issueNumber) ? raw.issueNumber : null,
    pageCount: Number.isFinite(raw.pageCount) ? raw.pageCount : null,
    image:
      imagePath && imageExtension ? toHttps(`${imagePath}.${imageExtension}`) : null,
    price,
    detailUrl: normalizeUrl(
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

export const toggleId = (ids, id) =>
  ids.includes(id) ? ids.filter((value) => value !== id) : [id, ...ids];

export const pushRecent = (ids, id, limit = RECENT_LIMIT) =>
  [id, ...ids.filter((value) => value !== id)].slice(0, limit);
