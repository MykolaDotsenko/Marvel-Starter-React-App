import {
  buildMarvelUrl,
  getAllowedCorsOrigin,
  isAllowedMarvelPath,
} from "./_marvelProxy.js";

const CACHE_CONTROL = "public, s-maxage=300, stale-while-revalidate=600";

const toSingleValue = (value) => (Array.isArray(value) ? value[0] : value);

const applyCorsHeaders = (request, response) => {
  const origin = getAllowedCorsOrigin(toSingleValue(request.headers?.origin));
  if (!origin) return;

  response.setHeader("Access-Control-Allow-Origin", origin);
  response.setHeader("Vary", "Origin");
};

export default async function handler(request, response) {
  applyCorsHeaders(request, response);

  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).json({
      error: "METHOD_NOT_ALLOWED",
      message: "Only GET requests are supported.",
    });
  }

  const path = toSingleValue(request.query.path);

  if (!isAllowedMarvelPath(path)) {
    return response.status(400).json({
      error: "INVALID_MARVEL_PATH",
      message: "Unsupported Marvel API path.",
    });
  }

  const publicKey = process.env.MARVEL_PUBLIC_KEY;
  const privateKey = process.env.MARVEL_PRIVATE_KEY;

  if (!publicKey || !privateKey) {
    return response.status(503).json({
      error: "MARVEL_PROXY_UNCONFIGURED",
      message:
        "Marvel API credentials are not configured for this deployment.",
    });
  }

  let upstreamUrl;

  try {
    upstreamUrl = buildMarvelUrl({
      path,
      query: request.query,
      publicKey,
      privateKey,
    });
  } catch {
    return response.status(400).json({
      error: "INVALID_MARVEL_REQUEST",
      message: "The Marvel API request is invalid.",
    });
  }

  try {
    const upstream = await fetch(upstreamUrl, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(10_000),
    });

    const payload = await upstream.json().catch(() => null);

    if (!upstream.ok) {
      return response.status(upstream.status).json({
        error: "MARVEL_UPSTREAM_ERROR",
        message:
          payload?.status ||
          payload?.message ||
          `Marvel API returned HTTP ${upstream.status}.`,
      });
    }

    response.setHeader("Cache-Control", CACHE_CONTROL);
    return response.status(200).json(payload);
  } catch (error) {
    const timedOut =
      error?.name === "TimeoutError" || error?.name === "AbortError";

    return response.status(timedOut ? 504 : 502).json({
      error: timedOut ? "MARVEL_UPSTREAM_TIMEOUT" : "MARVEL_UPSTREAM_UNAVAILABLE",
      message: timedOut
        ? "Marvel API timed out."
        : "Marvel API is temporarily unavailable.",
    });
  }
}
