import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const secretWars = {
  id: 52447,
  title: "Secret Wars (2015) #1",
  issueNumber: "1",
  detailUrl: "https://www.marvel.com/comics/issue/52447",
  seriesId: 19684,
  seriesName: "Secret Wars (2015 - 2016)",
  onSaleDate: "2015-05-06T00:00:00+0000",
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
  onSaleDate: "2019-02-06T00:00:00+0000",
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
  onSaleDate: "2012-12-05T00:00:00+0000",
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

const isPhone = (page) => {
  const viewport = page.viewportSize();
  return Boolean(viewport && viewport.width <= 700);
};

const expectTouchTarget = (box) => {
  expect(box).not.toBeNull();
  expect(Math.round(box.width)).toBeGreaterThanOrEqual(44);
  expect(Math.round(box.height)).toBeGreaterThanOrEqual(44);
};

const closePhoneDossier = async (page) => {
  if (!isPhone(page)) return;

  await expect(page.locator(".detail-rail--open")).toBeVisible();
  await page.getByRole("button", { name: /Close/ }).click();
  await expect(page.locator(".detail-rail--open")).toHaveCount(0);
};

test.beforeEach(async ({ page }) => {
  const attempts = new Map();

  await page.route("https://marvel.emreparker.com/v1/**", async (route) => {
    const url = new URL(route.request().url());
    const detailMatch = url.pathname.match(/\/v1\/issues\/(\d+)$/);

    if (detailMatch) {
      const id = Number(detailMatch[1]);
      const issue =
        id === secretWars.id
          ? secretWars
          : id === daredevil.id
            ? daredevil
            : avengers;
      await route.fulfill({ json: detail(issue) });
      return;
    }

    if (url.pathname === "/v1/search/issues") {
      const query = url.searchParams.get("q")?.toLowerCase() ?? "";
      if (query === "retry") {
        const attempt = (attempts.get(query) ?? 0) + 1;
        attempts.set(query, attempt);
        if (attempt === 1) {
          await route.fulfill({
            status: 503,
            json: { detail: "temporary provider failure" },
          });
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
    await route.fulfill({
      status: 204,
      contentType: "image/jpeg",
      body: "",
    });
  });
});




test("desktop dossier keeps an independent scrollport while the issue grid remains the page scroller", async ({ page }) => {
  const viewport = page.viewportSize();
  test.skip(!viewport || viewport.width <= 980, "Desktop master/detail contract");

  await page.setViewportSize({ width: 1440, height: 620 });
  await page.goto("/");

  await page
    .getByRole("button", { name: `Open issue details for ${secretWars.title}` })
    .click();

  await page.locator(".explorer").evaluate((element) => {
    element.style.minHeight = "1600px";
  });

  await page.evaluate(() => {
    const workspace = document.querySelector(".workspace");
    window.scrollTo({ top: workspace.offsetTop + 180, behavior: "instant" });
  });

  const rail = page.locator(".detail-rail");
  const card = page.locator(".detail-card");

  const contract = await card.evaluate((element) => {
    const style = getComputedStyle(element);
    const toolbar = element.querySelector(".detail-card__toolbar");

    return {
      clientHeight: element.clientHeight,
      scrollHeight: element.scrollHeight,
      overflowY: style.overflowY,
      toolbarPosition: toolbar ? getComputedStyle(toolbar).position : null,
    };
  });

  expect(contract.scrollHeight).toBeGreaterThan(contract.clientHeight);
  expect(["auto", "scroll"]).toContain(contract.overflowY);
  expect(contract.toolbarPosition).toBe("sticky");

  const railTop = await rail.evaluate((element) =>
    Math.round(element.getBoundingClientRect().top),
  );
  expect(railTop).toBeGreaterThanOrEqual(96);
  expect(railTop).toBeLessThanOrEqual(100);

  const pageScrollBefore = await page.evaluate(() => window.scrollY);

  await card.evaluate((element) => {
    element.scrollTop = Math.floor(element.scrollHeight * 0.55);
  });

  const detailScrollTop = await card.evaluate((element) => element.scrollTop);
  const pageScrollAfter = await page.evaluate(() => window.scrollY);

  expect(detailScrollTop).toBeGreaterThan(0);
  expect(Math.abs(pageScrollAfter - pageScrollBefore)).toBeLessThan(2);
});

test("phone UI uses app navigation, compact cards and minimum touch targets", async ({ page }) => {
  const viewport = page.viewportSize();
  test.skip(!viewport || viewport.width > 700, "Phone-only layout contract");

  await page.goto("/");

  const desktopNav = page.getByRole("navigation", { name: "Reading Atlas views" });
  const mobileNav = page.getByRole("navigation", { name: "Mobile Reading Atlas views" });

  await expect(desktopNav).toBeHidden();
  await expect(mobileNav).toBeVisible();

  const firstCard = page.locator(".issue-card").first();
  await expect(firstCard).toBeVisible();

  const cardBox = await firstCard.boundingBox();
  expect(cardBox?.height).toBeGreaterThanOrEqual(140);
  expect(cardBox?.height).toBeLessThanOrEqual(175);

  const cardActions = firstCard.locator(".card-action");
  for (let index = 0; index < await cardActions.count(); index += 1) {
    expectTouchTarget(await cardActions.nth(index).boundingBox());
  }

  const navButtons = mobileNav.getByRole("button");
  for (let index = 0; index < await navButtons.count(); index += 1) {
    const box = await navButtons.nth(index).boundingBox();
    expect(box).not.toBeNull();
    expect(Math.round(box.height)).toBeGreaterThanOrEqual(44);
  }

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(overflow).toBe(false);
});

test("phone search stays one-line and quick routes scroll horizontally", async ({ page }) => {
  const viewport = page.viewportSize();
  test.skip(!viewport || viewport.width > 700, "Phone-only layout contract");

  await page.goto("/");

  const shell = page.locator(".search-shell");
  const input = page.getByLabel("Search Marvel comics");
  const submit = page.getByRole("button", { name: "Search", exact: true });

  const [shellBox, inputBox, submitBox] = await Promise.all([
    shell.boundingBox(),
    input.boundingBox(),
    submit.boundingBox(),
  ]);

  expect(Math.abs((inputBox?.y ?? 0) - (submitBox?.y ?? 0))).toBeLessThan(10);
  expect(shellBox?.height).toBeLessThanOrEqual(62);
  expectTouchTarget(submitBox);

  const quick = page.locator(".quick-searches");
  const quickStyles = await quick.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      overflowX: style.overflowX,
      flexWrap: style.flexWrap,
    };
  });

  expect(["auto", "scroll"]).toContain(quickStyles.overflowX);
  expect(quickStyles.flexWrap).toBe("nowrap");
});

test("phone dossier opens as a fullscreen layer and closes back to discovery", async ({ page }) => {
  const viewport = page.viewportSize();
  test.skip(!viewport || viewport.width > 700, "Phone-only layout contract");

  await page.goto("/");
  await page
    .getByRole("button", { name: `Open issue details for ${secretWars.title}` })
    .click();

  await expect(page).toHaveURL(/issue=52447/);

  const rail = page.locator(".detail-rail--open");
  await expect(rail).toBeVisible();

  const railBox = await rail.boundingBox();
  expect(railBox?.width).toBeGreaterThanOrEqual(viewport.width - 1);
  expect(railBox?.height).toBeGreaterThanOrEqual(viewport.height - 1);

  const bodyOverflow = await page.evaluate(() => getComputedStyle(document.body).overflow);
  expect(bodyOverflow).toBe("hidden");

  const close = page.getByRole("button", { name: /Close/ });
  expectTouchTarget(await close.boundingBox());

  await close.click();
  await expect(page).not.toHaveURL(/issue=/);
  await expect(page.locator(".detail-rail--open")).toHaveCount(0);
  await expect(page.locator(".issue-grid")).toBeVisible();
});

test("editorial hero composes a route and promotes search into the sticky header", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator(".hero-title__line")).toHaveCount(3);
  await expect(page.locator(".hero-title__journey")).toContainText("reading journey");
  await expect(page.locator(".atlas-route-panel")).toBeVisible();
  await expect(page.getByRole("search", { name: "Sticky comic search" })).toHaveCount(0);

  await page.evaluate(() => {
    const workspace = document.querySelector(".workspace");
    window.scrollTo({ top: workspace.offsetTop + 180, behavior: "instant" });
  });

  const viewport = page.viewportSize();
  const stickySearch = page.getByRole("search", { name: "Sticky comic search" });

  if (viewport && viewport.width <= 980) {
    await expect(stickySearch).not.toBeVisible();
    return;
  }

  await expect(stickySearch).toHaveCount(1);
  await expect(stickySearch).toBeVisible();
  await page.getByLabel("Search Marvel comics from the sticky header").fill("Avengers");
  await page.getByRole("button", { name: "Search from sticky header" }).click();

  await expect(page).toHaveURL(/q=Avengers/);
  await expect(
    page.getByRole("button", { name: `Open issue details for ${avengers.title}` }),
  ).toBeVisible();
});

test("search, dossier, saved state and journey progress survive reload", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      name: /Build a Marvel reading journey you’ll actually finish/i,
    }),
  ).toBeVisible();

  await page.getByLabel("Search Marvel comics").fill("Secret Wars");
  await page.getByRole("button", { name: "Search", exact: true }).click();

  await expect(page).toHaveURL(/q=Secret\+Wars/);
  await expect(
    page.getByRole("heading", { name: "Find the next issue on your route." }),
  ).toBeVisible();

  await expect(page.getByText("May 6, 2015").first()).toBeVisible();

  await page
    .getByRole("button", { name: `Open issue details for ${secretWars.title}` })
    .click();

  await expect(page).toHaveURL(/issue=52447/);
  await expect(
    page.getByRole("heading", { name: secretWars.title, exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Jonathan Hickman")).toBeVisible();

  await page.getByRole("button", { name: "Save issue" }).click();
  await page.getByRole("button", { name: "Add to journey" }).click();
  await page.getByRole("button", { name: "Mark read" }).click();

  await page.reload();
  await expect(page.getByRole("button", { name: "Mark unread" })).toBeVisible();

  await closePhoneDossier(page);

  await expect(page.getByRole("button", { name: /Saved.*1 item/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Journey.*1 item/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Saved.*1 item/ })).toHaveAttribute(
    "aria-pressed",
    "false",
  );
});

test("saved shelf and recent timeline expose specialized local views", async ({ page }) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: `Open issue details for ${secretWars.title}` })
    .click();
  await page.getByRole("button", { name: "Save issue" }).click();
  await closePhoneDossier(page);

  await page.getByRole("button", { name: /Saved.*1 item/ }).click();
  await expect(page).toHaveURL(/view=saved/);
  await expect(
    page.getByRole("heading", { name: "Issues worth returning to" }),
  ).toBeVisible();
  await expect(page.locator(".saved-shelf")).toBeVisible();
  await expect(
    page.getByRole("button", { name: `Open issue details for ${secretWars.title}` }),
  ).toBeVisible();

  await page.getByRole("button", { name: /Recent.*1 item/ }).click();
  await expect(page).toHaveURL(/view=recent/);
  await expect(
    page.getByRole("heading", { name: "Recently opened dossiers" }),
  ).toBeVisible();
  await expect(page.locator(".recent-timeline")).toBeVisible();
  await expect(page.getByText("Just now")).toBeVisible();
});

test("a shared issue URL records the issue as recently viewed", async ({ page }) => {
  await page.goto("/?issue=52447&view=recent");

  await expect(
    page.getByRole("heading", { name: secretWars.title, exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /Recent.*1 item/ })).toBeVisible();

  await closePhoneDossier(page);

  await expect(
    page.getByRole("button", { name: `Open issue details for ${secretWars.title}` }),
  ).toBeVisible();
});

test("initial provider failure has a real retry path", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Search Marvel comics").fill("Retry");
  await page.getByRole("button", { name: "Search", exact: true }).click();

  await expect(
    page.getByRole("heading", {
      name: "Comic metadata is temporarily unavailable.",
    }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Retry request" }).click();

  await expect(
    page.getByRole("button", { name: `Open issue details for ${daredevil.title}` }),
  ).toBeVisible();
});

test("journey supports progress and deterministic accessible reordering", async ({ page }) => {
  await page.goto("/");

  await page
    .getByRole("button", { name: `Add ${secretWars.title} to reading list` })
    .click();
  await page
    .getByRole("button", { name: `Add ${daredevil.title} to reading list` })
    .click();

  await page.getByRole("button", { name: /Journey.*2 items/ }).click();
  await expect(page.getByText("0% complete")).toBeVisible();
  await expect(page.getByRole("button", { name: "Continue journey" })).toBeVisible();

  const firstRow = page.locator(".reading-item").filter({ hasText: secretWars.title });
  await firstRow.getByRole("button", { name: "Mark read", exact: true }).click();
  await expect(page.getByText("50% complete")).toBeVisible();

  await page
    .getByRole("button", { name: `Move ${daredevil.title} up` })
    .click();
  await expect(page.locator(".reading-item").first()).toContainText(daredevil.title);
});

test("browser Back and Forward restore URL-driven discovery state", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Search Marvel comics").fill("Secret Wars");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(page).toHaveURL(/q=Secret\+Wars/);

  await page.getByRole("button", { name: "Daredevil", exact: true }).click();
  await expect(page).toHaveURL(/q=Daredevil/);
  await expect(
    page.getByRole("button", { name: `Open issue details for ${daredevil.title}` }),
  ).toBeVisible();

  await page.goBack();
  await expect(page).toHaveURL(/q=Secret\+Wars/);
  await expect(
    page.getByRole("button", { name: `Open issue details for ${secretWars.title}` }),
  ).toBeVisible();

  await page.goForward();
  await expect(page).toHaveURL(/q=Daredevil/);
});

test("main interactive state has no automated accessibility violations", async ({ page }) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: `Open issue details for ${secretWars.title}` })
    .click();

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test("layout does not create horizontal overflow in full and compact hero states", async ({ page }) => {
  await page.goto("/");

  const fullOverflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth,
  );
  expect(fullOverflow).toBe(false);

  await page.getByRole("button", { name: "Secret Wars", exact: true }).click();
  await expect(page.locator(".hero")).toHaveClass(/hero--compact/);

  const compactOverflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth,
  );
  expect(compactOverflow).toBe(false);
});
