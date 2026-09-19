import { createHash } from "node:crypto";

const API_BASE = "https://gateway.marvel.com/v1/public";
const ALLOWED_PATH = /^characters(?:\/\d+(?:\/comics)?)?$/;
const ALLOWED_ORDER = new Set(["name", "-onsaleDate"]);
const ALLOWED_FORMAT_TYPE = new Set(["comic"]);

const positiveInteger = (value, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) => {
  if (value === undefined || value === null || value === "") return null;
  const number = Number(value);
  if (!Number.isInteger(number) || number < min || number > max) return null;
  return number;
};

export const isAllowedMarvelPath = (path) =>
  typeof path === "string" && ALLOWED_PATH.test(path);

export const createMarvelHash = ({
  timestamp,
  publicKey,
  privateKey,
}) =>
  createHash("md5")
    .update(`${timestamp}${privateKey}${publicKey}`)
    .digest("hex");

export const buildMarvelUrl = ({
  path,
  query,
  publicKey,
  privateKey,
  timestamp = Date.now().toString(),
}) => {
  if (!isAllowedMarvelPath(path)) {
    throw new TypeError("Unsupported Marvel API path.");
  }

  if (!publicKey || !privateKey) {
    throw new TypeError("Marvel API credentials are not configured.");
  }

  const url = new URL(`${API_BASE}/${path}`);
  url.searchParams.set("ts", timestamp);
  url.searchParams.set("apikey", publicKey);
  url.searchParams.set(
    "hash",
    createMarvelHash({ timestamp, publicKey, privateKey }),
  );

  const limit = positiveInteger(query.limit, { min: 1, max: 100 });
  const offset = positiveInteger(query.offset, { min: 0, max: 100_000 });

  if (limit !== null) url.searchParams.set("limit", String(limit));
  if (offset !== null) url.searchParams.set("offset", String(offset));

  if (ALLOWED_ORDER.has(query.orderBy)) {
    url.searchParams.set("orderBy", query.orderBy);
  }

  if (typeof query.nameStartsWith === "string") {
    const value = query.nameStartsWith.trim().replace(/\s+/g, " ").slice(0, 80);
    if (value) url.searchParams.set("nameStartsWith", value);
  }

  if (ALLOWED_FORMAT_TYPE.has(query.formatType)) {
    url.searchParams.set("formatType", query.formatType);
  }

  if (query.noVariants === "true" || query.noVariants === true) {
    url.searchParams.set("noVariants", "true");
  }

  return url;
};
