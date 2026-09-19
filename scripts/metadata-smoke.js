const base =
  process.env.MARVEL_METADATA_API || "https://marvel.emreparker.com/v1";

const fetchJson = async (url, label) => {
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    throw new Error(
      `Marvel Metadata API ${label} failed with HTTP ${response.status}.`,
    );
  }

  return response.json();
};

await fetchJson(new URL(`${base}/health`), "health check");

const listUrl = new URL(`${base}/issues`);
listUrl.searchParams.set("limit", "1");
listUrl.searchParams.set("offset", "0");

const listPayload = await fetchJson(listUrl, "issue-list contract check");
const summary = listPayload?.items?.[0];

if (
  !Number.isInteger(summary?.id) ||
  typeof summary?.title !== "string" ||
  !summary.title.trim() ||
  typeof listPayload?.has_next !== "boolean"
) {
  throw new TypeError(
    "Marvel Metadata API list contract returned an unexpected shape.",
  );
}

const detail = await fetchJson(
  new URL(`${base}/issues/${summary.id}`),
  "issue-detail contract check",
);

if (
  detail?.id !== summary.id ||
  typeof detail?.title !== "string" ||
  !detail.title.trim() ||
  !Array.isArray(detail?.creators)
) {
  throw new TypeError(
    "Marvel Metadata API detail contract returned an unexpected shape.",
  );
}

console.log(
  `Marvel Metadata API contract OK: ${detail.title} (#${detail.id})`,
);
