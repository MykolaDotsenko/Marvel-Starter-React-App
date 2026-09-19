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
  await page.route("https://gateway.marvel.com/v1/public/**", async (route) => {
    const url = new URL(route.request().url());
    const comicMatch = url.pathname.match(/characters\/(\d+)\/comics$/);
    const characterMatch = url.pathname.match(/characters\/(\d+)$/);

    if (comicMatch) {
      await route.fulfill({ json: apiPayload([comic]) });
      return;
    }

    if (characterMatch) {
      const character =
        Number(characterMatch[1]) === spider.id ? spider : storm;
      await route.fulfill({ json: apiPayload([character]) });
      return;
    }

    const query = url.searchParams.get("nameStartsWith")?.toLowerCase();
    const results = query?.startsWith("spider") ? [spider] : [spider, storm];
    await route.fulfill({ json: apiPayload(results) });
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
  await expect(
    page.getByRole("button", { name: "Open details for Spider-Man" }),
  ).toBeVisible();

  await page
    .getByRole("button", { name: "Open details for Spider-Man" })
    .click();

  await expect(page).toHaveURL(/character=1009610/);
  await expect(
    page.getByRole("heading", { name: "Spider-Man", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("The Amazing Spider-Man")).toBeVisible();

  await page.getByRole("button", { name: "Save character" }).click();
  await expect(page.getByRole("button", { name: "Saved" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );

  await page.reload();
  await expect(page.getByRole("button", { name: "Saved" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

test("main state has no serious accessibility violations", async ({ page }) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Open details for Spider-Man" })
    .click();

  const results = await new AxeBuilder({ page }).analyze();

  expect(results.violations).toEqual([]);
});

test("mobile layout does not create horizontal overflow", async ({ page }) => {
  await page.goto("/");
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(overflow).toBe(false);
});
