const base =
  process.env.MARVEL_METADATA_API || "https://marvel.emreparker.com/v1";

const health = await fetch(new URL(`${base}/health`), {
  headers: { Accept: "application/json" },
  signal: AbortSignal.timeout(10_000),
});

if (!health.ok) {
  throw new Error(
    `Marvel Metadata API health check failed with HTTP ${health.status}.`,
  );
}

const response = await fetch(new URL(`${base}/issues/52447`), {
  headers: { Accept: "application/json" },
  signal: AbortSignal.timeout(10_000),
});

if (!response.ok) {
  throw new Error(
    `Marvel Metadata API contract check failed with HTTP ${response.status}.`,
  );
}

const issue = await response.json();

if (
  !Number.isInteger(issue?.id) ||
  typeof issue?.title !== "string" ||
  !issue.title.trim() ||
  !Array.isArray(issue?.creators)
) {
  throw new TypeError(
    "Marvel Metadata API contract smoke returned an unexpected issue shape.",
  );
}

console.log(`Marvel Metadata API contract OK: ${issue.title} (#${issue.id})`);
