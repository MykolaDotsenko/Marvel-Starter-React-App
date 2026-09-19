import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const secretWars = {
  id: 52447,
  title: "Secret Wars (2015) #1",
  issueNumber: "1",
  detailUrl: "https://www.marvel.com/comics/issue/52447",
  seriesId: 19684,
  seriesName: "Secret Wars (2015 - 2016)",
  onSaleDate: "2015-05-06",
  unlimitedDate: "2015-11-04",
  yearPage: 2015,
};
const daredevil = {
  id: 70001,
  title: "Daredevil (2019) #1",
  issueNumber: "1",
  detailUrl: "https://www.marvel.com/comics/issue/70001",
  seriesId: 21000,
  seriesName: "Daredevil (2019 - 2021)",
  onSaleDate: "2019-02-06",
  unlimitedDate: "2019-08-05",
  yearPage: 2019,
};
const avengers = {
  id: 80001,
  title: "Avengers (2012) #1",
  issueNumber: "1",
  detailUrl: "https://www.marvel.com/comics/issue/80001",
  seriesId: 16452,
  seriesName: "Avengers (2012 - 2015)",
  onSaleDate: "2012-12-05",
  unlimitedDate: "2013-06-05",
  yearPage: 2012,
};
const detail = (issue) => ({
  ...issue,
  digitalId: issue.id + 1,
  description: `Reading metadata for ${issue.title}.`,
  modified: "2026-01-01",
  pageCount: 48,
  creators: [
    { id: 11743, name: "Jonathan Hickman", role: "writer" },
    { id: 123, name: "Test Artist", role: "penciler" },
  ],
  cover: { path: `https://images.example.test/${issue.id}`, extension: "jpg" },
});

test.beforeEach(async ({ page }) => {
  const attempts = new Map();

  await page.route("https://marvel.emreparker.com/v1/**", async (route) => {
    const url = new URL(route.request().url());
    const detailMatch = url.pathname.match(/\/v1\/issues\/(\d+)$/);

    if (detailMatch) {
      const id = Number(detailMatch[1]);
      const issue = id === secretWars.id ? secretWars : id === daredevil.id ? daredevil : avengers;
      await route.fulfill({ json: detail(issue) });
      return;
    }

    if (url.pathname === "/v1/search/issues") {
      const query = url.searchParams.get("q")?.toLowerCase() ?? "";
      if (query === "retry") {
        const attempt = (attempts.get(query) ?? 0) + 1;
        attempts.set(query, attempt);
        if (attempt === 1) {
          await route.fulfill({ status: 503, json: { detail: "temporary provider failure" } });
          return;
        }
        await route.fulfill({ json: { query, items: [daredevil], count: 1 } });
        return;
      }

      const items = query.includes("secret")
        ? [secretWars]
        : query.includes("daredevil")
          ? [daredevil]
          : query.includes("avengers")
            ? [avengers]
            : [];
      await route.fulfill({ json: { query, items, count: items.length } });
      return;
    }

    if (url.pathname === "/v1/issues") {
      await route.fulfill({
        json: {
          items: [secretWars, daredevil, avengers],
          total: 3,
          limit: 12,
          offset: 0,
          has_next: false,
        },
      });
      return;
    }

    await route.fallback();
  });

  await page.route("https://images.example.test/**", async (route) => {
    await route.fulfill({ status: 204, contentType: "image/jpeg", body: "" });
  });
});

test("search, dossier, saved state and reading progress survive reload", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Turn Marvel discovery into a reading plan you can finish/i })).toBeVisible();

  await page.getByLabel("Comic title").fill("Secret Wars");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(page).toHaveURL(/q=Secret\+Wars/);

  await page.getByRole("button", { name: `Open issue details for ${secretWars.title}` }).click();
  await expect(page).toHaveURL(/issue=52447/);
  await expect(page.getByRole("heading", { name: secretWars.title, exact: true })).toBeVisible();
  await expect(page.getByText("Jonathan Hickman")).toBeVisible();

  await page.getByRole("button", { name: "Save issue" }).click();
  await page.getByRole("button", { name: "Add to reading list" }).click();
  await page.getByRole("button", { name: "Mark as read" }).click();
  await expect(page.getByRole("button", { name: /Saved 1/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Reading 1/ })).toBeVisible();

  await page.reload();
  await expect(page.getByRole("button", { name: "Saved", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: "Mark unread" })).toBeVisible();
});

test("saved and recent views expose durable local value", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: `Open issue details for ${secretWars.title}` }).click();
  await page.getByRole("button", { name: "Save issue" }).click();

  await page.getByRole("button", { name: /Saved 1/ }).click();
  await expect(page).toHaveURL(/view=saved/);
  await expect(page.getByRole("heading", { name: "Saved issues" })).toBeVisible();
  await expect(page.getByRole("button", { name: `Open issue details for ${secretWars.title}` })).toBeVisible();
  await expect(page.getByRole("button", { name: `Open issue details for ${daredevil.title}` })).toHaveCount(0);

  await page.getByRole("button", { name: /Recent 1/ }).click();
  await expect(page).toHaveURL(/view=recent/);
  await expect(page.getByRole("heading", { name: "Recently viewed" })).toBeVisible();
});

test("a shared issue URL records the issue as recently viewed", async ({ page }) => {
  await page.goto("/?issue=52447&view=recent");
  await expect(page.getByRole("heading", { name: secretWars.title, exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /Recent 1/ })).toBeVisible();
  await expect(page.getByRole("button", { name: `Open issue details for ${secretWars.title}` })).toBeVisible();
});

test("initial provider failure has a real retry path", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Comic title").fill("Retry");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Comic metadata is temporarily unavailable." })).toBeVisible();
  await page.getByRole("button", { name: "Retry request" }).click();
  await expect(page.getByRole("button", { name: `Open issue details for ${daredevil.title}` })).toBeVisible();
});

test("reading list supports progress and deterministic reordering", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: `Add ${secretWars.title} to reading list` }).click();
  await page.getByRole("button", { name: `Add ${daredevil.title} to reading list` }).click();

  await page.getByRole("button", { name: /Reading 2/ }).click();
  await expect(page.getByText("0% complete")).toBeVisible();

  const firstRow = page.locator(".reading-item").filter({ hasText: secretWars.title });
  await firstRow.getByRole("button", { name: "Read", exact: true }).click();
  await expect(page.getByText("50% complete")).toBeVisible();

  await page.getByRole("button", { name: `Move ${daredevil.title} up` }).click();
  await expect(page.locator(".reading-item").first()).toContainText(daredevil.title);
});

test("browser Back and Forward restore URL-driven discovery state", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Comic title").fill("Secret Wars");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(page).toHaveURL(/q=Secret\+Wars/);

  await page.getByRole("button", { name: "Daredevil", exact: true }).click();
  await expect(page).toHaveURL(/q=Daredevil/);
  await expect(page.getByRole("button", { name: `Open issue details for ${daredevil.title}` })).toBeVisible();

  await page.goBack();
  await expect(page).toHaveURL(/q=Secret\+Wars/);
  await expect(page.getByRole("button", { name: `Open issue details for ${secretWars.title}` })).toBeVisible();

  await page.goForward();
  await expect(page).toHaveURL(/q=Daredevil/);
});

test("main interactive state has no automated accessibility violations", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: `Open issue details for ${secretWars.title}` }).click();
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test("layout does not create horizontal overflow", async ({ page }) => {
  await page.goto("/");
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(overflow).toBe(false);
});
