import { describe, expect, it } from "vitest";
import {
  buildMarvelUrl,
  createMarvelHash,
  getAllowedCorsOrigin,
  isAllowedMarvelPath,
} from "../api/_marvelProxy.js";

describe("Marvel production proxy", () => {
  it("uses the documented Marvel server-side hash contract", () => {
    expect(
      createMarvelHash({
        timestamp: "1",
        publicKey: "1234",
        privateKey: "abcd",
      }),
    ).toBe("ffd275c5130566a2916217b101f26150");
  });

  it("allows only the exact character endpoints used by the product", () => {
    expect(isAllowedMarvelPath("characters")).toBe(true);
    expect(isAllowedMarvelPath("characters/1009610")).toBe(true);
    expect(isAllowedMarvelPath("characters/1009610/comics")).toBe(true);

    expect(isAllowedMarvelPath("comics")).toBe(false);
    expect(isAllowedMarvelPath("../characters")).toBe(false);
    expect(isAllowedMarvelPath("characters/1/../../comics")).toBe(false);
  });

  it("allows CORS only for the GitHub Pages frontend origin", () => {
    expect(getAllowedCorsOrigin("https://mykoladotsenko.github.io")).toBe(
      "https://mykoladotsenko.github.io",
    );
    expect(getAllowedCorsOrigin("https://example.com")).toBeNull();
    expect(getAllowedCorsOrigin(undefined)).toBeNull();
  });

  it("whitelists and normalizes forwarded query parameters", () => {
    const url = buildMarvelUrl({
      path: "characters",
      publicKey: "1234",
      privateKey: "abcd",
      timestamp: "1",
      query: {
        limit: "12",
        offset: "0",
        orderBy: "name",
        nameStartsWith: "  Spider   Man ",
        unexpected: "do-not-forward",
      },
    });

    expect(url.searchParams.get("apikey")).toBe("1234");
    expect(url.searchParams.get("ts")).toBe("1");
    expect(url.searchParams.get("hash")).toBe(
      "ffd275c5130566a2916217b101f26150",
    );
    expect(url.searchParams.get("nameStartsWith")).toBe("Spider Man");
    expect(url.searchParams.has("unexpected")).toBe(false);
  });
});
