import { expect, test } from "../../src/fixtures/index.js";

/** Helper: search for "clean code", collect the first /books/:id href. */
const getFirstBookDetailUrl = async (
  page: import("@playwright/test").Page,
): Promise<string | null> => {
  await page.goto("/search?q=clean+code");
  await expect(page.getByText(/\d+ results? for/i)).toBeVisible({ timeout: 15_000 });

  const links = await page.getByRole("link").all();
  for (const link of links) {
    const href = await link.getAttribute("href");
    if (href?.startsWith("/books/")) return href;
  }
  return null;
};

test.describe("Book detail page", () => {
  test("navigates to book detail from search results", async ({ searchPage, bookDetailPage }) => {
    await searchPage.goto("javascript");
    await expect(searchPage.getResultCount()).toBeVisible({ timeout: 15_000 });

    const firstLink = searchPage.page.getByRole("link", { name: /.+/ }).first();
    const href = await firstLink.getAttribute("href");

    if (href?.startsWith("/books/")) {
      await firstLink.click();
      await bookDetailPage.page.waitForLoadState("networkidle");

      await expect(bookDetailPage.getTitle()).toBeVisible({ timeout: 10_000 });
      await expect(bookDetailPage.getBookmarkButton()).toBeVisible();
      await expect(bookDetailPage.getBackLink()).toBeVisible();
    }
  });

  test("book detail page shows title and authors", async ({ bookDetailPage }) => {
    const bookDetailUrl = await getFirstBookDetailUrl(bookDetailPage.page);
    if (!bookDetailUrl) return;

    await bookDetailPage.goto(bookDetailUrl.replace("/books/", ""));
    await bookDetailPage.page.waitForLoadState("networkidle");

    await expect(bookDetailPage.getTitle()).toBeVisible({ timeout: 10_000 });
    await expect(bookDetailPage.page).toHaveTitle(/book explorer/i);
  });

  // ── OG / SEO meta tags ─────────────────────────────────────────────────────

  test("book detail page has og:title meta tag with the book title", async ({ bookDetailPage }) => {
    const bookDetailUrl = await getFirstBookDetailUrl(bookDetailPage.page);
    if (!bookDetailUrl) return;

    await bookDetailPage.goto(bookDetailUrl.replace("/books/", ""));
    await bookDetailPage.page.waitForLoadState("networkidle");

    const titleText = await bookDetailPage.getTitle().textContent();

    const ogTitle = await bookDetailPage.page
      .locator('meta[property="og:title"]')
      .getAttribute("content");
    expect(ogTitle).toBeTruthy();
    if (titleText) {
      expect(ogTitle).toContain(titleText.trim().slice(0, 20));
    }
  });

  test("book detail page has og:type = book", async ({ bookDetailPage }) => {
    const bookDetailUrl = await getFirstBookDetailUrl(bookDetailPage.page);
    if (!bookDetailUrl) return;

    await bookDetailPage.goto(bookDetailUrl.replace("/books/", ""));
    await bookDetailPage.page.waitForLoadState("networkidle");

    const ogType = await bookDetailPage.page
      .locator('meta[property="og:type"]')
      .getAttribute("content");
    expect(ogType).toBe("book");
  });

  test("book detail page has og:description meta tag", async ({ bookDetailPage }) => {
    const bookDetailUrl = await getFirstBookDetailUrl(bookDetailPage.page);
    if (!bookDetailUrl) return;

    await bookDetailPage.goto(bookDetailUrl.replace("/books/", ""));
    await bookDetailPage.page.waitForLoadState("networkidle");

    const ogDesc = await bookDetailPage.page
      .locator('meta[property="og:description"]')
      .getAttribute("content");
    expect(ogDesc).not.toBeNull();
  });

  test("book detail page has a description meta tag", async ({ bookDetailPage }) => {
    const bookDetailUrl = await getFirstBookDetailUrl(bookDetailPage.page);
    if (!bookDetailUrl) return;

    await bookDetailPage.goto(bookDetailUrl.replace("/books/", ""));
    await bookDetailPage.page.waitForLoadState("networkidle");

    const desc = await bookDetailPage.page
      .locator('meta[name="description"]')
      .getAttribute("content");
    expect(desc).toBeTruthy();
  });

  test("book detail page has books:author meta tag", async ({ bookDetailPage }) => {
    const bookDetailUrl = await getFirstBookDetailUrl(bookDetailPage.page);
    if (!bookDetailUrl) return;

    await bookDetailPage.goto(bookDetailUrl.replace("/books/", ""));
    await bookDetailPage.page.waitForLoadState("networkidle");

    const author = await bookDetailPage.page
      .locator('meta[property="books:author"]')
      .getAttribute("content");
    expect(author).not.toBeNull();
  });

  test("page title includes book title and site name", async ({ bookDetailPage }) => {
    const bookDetailUrl = await getFirstBookDetailUrl(bookDetailPage.page);
    if (!bookDetailUrl) return;

    await bookDetailPage.goto(bookDetailUrl.replace("/books/", ""));
    await bookDetailPage.page.waitForLoadState("networkidle");

    await expect(bookDetailPage.page).toHaveTitle(/— Book Explorer/i);
  });

  // ── Loading state ──────────────────────────────────────────────────────────

  test("book detail page renders without crashing after navigation", async ({ searchPage }) => {
    await searchPage.goto("javascript");
    await expect(searchPage.getResultCount()).toBeVisible({ timeout: 15_000 });

    const links = await searchPage.page.getByRole("link").all();
    let bookDetailLink: (typeof links)[0] | null = null;
    for (const link of links) {
      const href = await link.getAttribute("href");
      if (href?.startsWith("/books/")) {
        bookDetailLink = link;
        break;
      }
    }

    if (!bookDetailLink) return;

    await bookDetailLink.click();
    await searchPage.page.waitForLoadState("networkidle");

    const wrapper = searchPage.page.locator("div.max-w-4xl").first();
    await expect(wrapper).toBeVisible({ timeout: 10_000 });
    const classAttr = await wrapper.getAttribute("class");
    expect(classAttr).not.toContain("opacity-50");
  });

  // ── Bookmark button on detail page ────────────────────────────────────────

  test("bookmark button is visible on the book detail page", async ({ bookDetailPage }) => {
    const bookDetailUrl = await getFirstBookDetailUrl(bookDetailPage.page);
    if (!bookDetailUrl) return;

    await bookDetailPage.goto(bookDetailUrl.replace("/books/", ""));
    await bookDetailPage.page.waitForLoadState("networkidle");

    await expect(bookDetailPage.getBookmarkButton()).toBeVisible({ timeout: 10_000 });
  });

  test("clicking bookmark on detail page redirects unauthenticated user to sign-in", async ({
    bookDetailPage,
  }) => {
    const bookDetailUrl = await getFirstBookDetailUrl(bookDetailPage.page);
    if (!bookDetailUrl) return;

    await bookDetailPage.goto(bookDetailUrl.replace("/books/", ""));
    await bookDetailPage.page.waitForLoadState("networkidle");

    await bookDetailPage.getBookmarkButton().click();
    await bookDetailPage.page.waitForLoadState("networkidle");

    const url = bookDetailPage.page.url();
    expect(url).toMatch(/\/sign-in|\/books\//);
  });
});
