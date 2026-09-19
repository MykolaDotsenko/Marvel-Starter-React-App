const apiKey =
  process.env.MARVEL_PUBLIC_KEY ||
  "6f00fba70811bdd9daa3cf27662d5b52";

const url = new URL("https://gateway.marvel.com/v1/public/characters");
url.searchParams.set("apikey", apiKey);
url.searchParams.set("limit", "1");
url.searchParams.set("orderBy", "name");

const response = await fetch(url, {
  headers: { Accept: "application/json" },
  signal: AbortSignal.timeout(10_000),
});

if (!response.ok) {
  throw new Error(`Marvel API smoke failed with HTTP ${response.status}.`);
}

const payload = await response.json();
const result = payload?.data?.results?.[0];

if (
  !Number.isInteger(result?.id) ||
  typeof result?.name !== "string" ||
  !result.name.trim() ||
  typeof result?.thumbnail?.path !== "string" ||
  typeof result?.thumbnail?.extension !== "string"
) {
  throw new TypeError("Marvel API contract smoke returned an unexpected shape.");
}

console.log(
  `Marvel API contract OK: ${result.name} (#${result.id})`,
);
