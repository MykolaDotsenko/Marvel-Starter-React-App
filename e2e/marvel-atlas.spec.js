import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const spider = {
  id: 1009610,
  name: "Spider-Man",
  description: "Friendly neighborhood hero.",
  thumbnail: {
    path: "https://images.example.test/spider-man",
    extension: "jpg",
  },
  comics: { available: 2843, items: [{ name: "Amazing Spider-Man #1" }] },
  series: { available: 712 },
  stories: { available: 3900 },
  urls: [{ type: "detail", url: "https://www.marvel.com/characters/spider-man" }],
};

const storm = {
  id: 1009629,
  name: "Storm",
  description: "Mutant leader and weather manipulator.",
  thumbnail: {
    path: "https://images.example.test/storm",
    extension: "jpg",
  },
  comics: { available: 1300, items: [{ name: "X-Men #1" }] },
  series: { available: 420 },
  stories: { available: 2100 },
  urls: [{ type: "detail", url: "https://www.marvel.com/characters/storm" }],
};

const ironMan = {
  id: 1009368,
  name: "Iron Man",
  description: "Armored Avenger.",
  thumbnail: {
    path: "https://images.example.test/iron-man",
    extension: "jpg",
  },
  comics: { available: 2100, items: [{ name: "Invincible Iron Man #1" }] },
  series: { available: 600 },
  stories: { available: 3300 },
  urls: [{ type: "detail", url: "https://www.marvel.com/characters/iron-man" }],
};

const comic = {
  id: 9001,
  title: "The Amazing Spider-Man",
  description: "",
  issueNumber: 1,
  pageCount: 32,
  thumbnail: {
    path: "https://images.example.test/comic",
    extension: "jpg",
  },
  prices: [{ price: 4.99 }],
  urls: [{ type: "detail", url: "https://www.marvel.com/comics/issue/9001" }],
};

const apiPayload = (results) => ({
  code: 200,
  status: "Ok",
  data: {
    offset: 0,
    limit: 12,
    total: results.length,
    count: results.length,
    results,
  },
});

test.beforeEach(async ({ page }) => {
  const attempts = new Map();

  await page.route("https://gateway.marvel.com/v1/public/**", async (route) => {
    const url = new URL(route.request().url());
    const comicMatch = url.pathname.match(/characters\/(\d+)\/comics$/);
    const characterMatch = url.pathname.match(/characters\/(\d+)$/);

    if (comicMatch) {
      if (Number(comicMatch[1]) === storm.id) {
        await route.fulfill({ status: 503, json: { status: "temporary" } });
        return;
      }

      await route.fulfill({ json: apiPayload([comic]) });
      return;
    }

    if (characterMatch) {
      const id = Number(characterMatch[1]);
      const character =
        id === spider.id ? spider : id === ironMan.id ? ironMan : storm;
      await route.fulfill({ json: apiPayload([character]) });
      return;
    }

    const query = url.searchParams.get("nameStartsWith")?.toLowerCase();

    if (query === "retry") {
      const attempt = (attempts.get(query) ?? 0) + 1;
      attempts.set(query, attempt);

      if (attempt === 1) {
        await route.fulfill({ status: 503, json: { status: "temporary" } });
        return;
      }

      await route.fulfill({ json: apiPayload([storm]) });
      return;
    }

    if (query?.startsWith("spider")) {
      await route.fulfill({ json: apiPayload([spider]) });
      return;
    }

    if (query?.startsWith("iron")) {
      await route.fulfill({ json: apiPayload([ironMan]) });
      return;
    }

    await route.fulfill({ json: apiPayload([spider, storm, ironMan]) });
  });

  await page.route("https://images.example.test/**", async (route) => {
    await route.fulfill({
      status: 204,
      contentType: "image/jpeg",
      body: "",
    });
  });
});

test("search, URL state, detail and local favorite survive reload", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      name: /Explore the Marvel universe without losing the signal/i,
    }),
  ).toBeVisible();

  await page.getByLabel("Character name").fill("Spider");
  await page.getByRole("button", { name: "Search", exact: true }).click();

  await expect(page).toHaveURL(/\?q=Spider/);
  await page
    .getByRole("button", { name: "Open details for Spider-Man" })
    .click();

  await expect(page).toHaveURL(/character=1009610/);
  await expect(
    page.getByRole("heading", { name: "Spider-Man", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("The Amazing Spider-Man")).toBeVisible();

  await page.getByRole("button", { name: "Save character" }).click();
  await expect(page.getByRole("button", { name: "Saved", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.getByRole("button", { name: /Saved 1/ })).toBeVisible();

  await page.reload();
  await expect(page.getByRole("button", { name: "Saved", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

test("saved and recent views expose durable local product value", async ({ page }) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Open details for Spider-Man" })
    .click();
  await page.getByRole("button", { name: "Save character" }).click();

  await page.getByRole("button", { name: /Saved 1/ }).click();
  await expect(page).toHaveURL(/view=saved/);
  await expect(
    page.getByRole("heading", { name: "Saved characters" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Open details for Spider-Man" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Open details for Storm" }),
  ).toHaveCount(0);

  await page.getByRole("button", { name: /Recent 1/ }).click();
  await expect(page).toHaveURL(/view=recent/);
  await expect(
    page.getByRole("heading", { name: "Recently viewed" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Open details for Spider-Man" }),
  ).toBeVisible();
});

test("a directly shared character URL is recorded as recently viewed", async ({ page }) => {
  await page.goto("/?character=1009610&view=recent");

  await expect(
    page.getByRole("heading", { name: "Spider-Man", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /Recent 1/ })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Open details for Spider-Man" }),
  ).toBeVisible();
});

test("initial request failure has a real retry path", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Character name").fill("Retry");
  await page.getByRole("button", { name: "Search", exact: true }).click();

  await expect(
    page.getByRole("heading", { name: "Marvel data is temporarily unavailable." }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Retry request" }).click();

  await expect(
    page.getByRole("button", { name: "Open details for Storm" }),
  ).toBeVisible();
  await expect(page.getByText("No characters matched this prefix.")).toHaveCount(0);
});

test("secondary comics failure does not destroy a valid character dossier", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open details for Storm" }).click();

  await expect(
    page.getByRole("heading", { name: "Storm", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("No recent comic metadata is available for this character."),
  ).toBeVisible();
});

test("browser Back and Forward restore URL-driven discovery state", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Character name").fill("Spider");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(page).toHaveURL(/q=Spider/);

  await page.getByRole("button", { name: "Iron", exact: true }).click();
  await expect(page).toHaveURL(/q=Iron/);
  await expect(
    page.getByRole("button", { name: "Open details for Iron Man" }),
  ).toBeVisible();

  await page.goBack();
  await expect(page).toHaveURL(/q=Spider/);
  await expect(
    page.getByRole("button", { name: "Open details for Spider-Man" }),
  ).toBeVisible();

  await page.goForward();
  await expect(page).toHaveURL(/q=Iron/);
});

test("main interactive state has no automated accessibility violations", async ({ page }) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Open details for Spider-Man" })
    .click();

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test("layout does not create horizontal overflow", async ({ page }) => {
  await page.goto("/");
  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth,
  );
  expect(overflow).toBe(false);
});
