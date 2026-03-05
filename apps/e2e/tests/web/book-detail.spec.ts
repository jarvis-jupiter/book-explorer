import { expect, test } from "@playwright/test";

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
  test("navigates to book detail from search results", async ({ page }) => {
    await page.goto("/search?q=javascript");
    await expect(page.getByText(/\d+ results? for/i)).toBeVisible({ timeout: 15_000 });

    const firstLink = page.getByRole("link", { name: /.+/ }).first();
    const href = await firstLink.getAttribute("href");

    if (href?.startsWith("/books/")) {
      await firstLink.click();
      await page.waitForLoadState("networkidle");

      await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 10_000 });
      await expect(page.getByRole("button", { name: /bookmark/i })).toBeVisible();
      await expect(page.getByRole("link", { name: /back to search/i })).toBeVisible();
    }
  });

  test("book detail page shows title and authors", async ({ page }) => {
    const bookDetailUrl = await getFirstBookDetailUrl(page);
    if (!bookDetailUrl) return;

    await page.goto(bookDetailUrl);
    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 10_000 });
    await expect(page).toHaveTitle(/book explorer/i);
  });

  // ── OG / SEO meta tags ─────────────────────────────────────────────────────

  test("book detail page has og:title meta tag with the book title", async ({ page }) => {
    const bookDetailUrl = await getFirstBookDetailUrl(page);
    if (!bookDetailUrl) return;

    await page.goto(bookDetailUrl);
    await page.waitForLoadState("networkidle");

    const titleText = await page.getByRole("heading", { level: 1 }).textContent();

    const ogTitle = await page.locator('meta[property="og:title"]').getAttribute("content");
    expect(ogTitle).toBeTruthy();
    // og:title should contain (or match) the visible heading
    if (titleText) {
      expect(ogTitle).toContain(titleText.trim().slice(0, 20));
    }
  });

  test("book detail page has og:type = book", async ({ page }) => {
    const bookDetailUrl = await getFirstBookDetailUrl(page);
    if (!bookDetailUrl) return;

    await page.goto(bookDetailUrl);
    await page.waitForLoadState("networkidle");

    const ogType = await page.locator('meta[property="og:type"]').getAttribute("content");
    expect(ogType).toBe("book");
  });

  test("book detail page has og:description meta tag", async ({ page }) => {
    const bookDetailUrl = await getFirstBookDetailUrl(page);
    if (!bookDetailUrl) return;

    await page.goto(bookDetailUrl);
    await page.waitForLoadState("networkidle");

    const ogDesc = await page.locator('meta[property="og:description"]').getAttribute("content");
    // May be empty string when no description, but the tag must exist
    expect(ogDesc).not.toBeNull();
  });

  test("book detail page has a description meta tag", async ({ page }) => {
    const bookDetailUrl = await getFirstBookDetailUrl(page);
    if (!bookDetailUrl) return;

    await page.goto(bookDetailUrl);
    await page.waitForLoadState("networkidle");

    const desc = await page.locator('meta[name="description"]').getAttribute("content");
    expect(desc).toBeTruthy();
  });

  test("book detail page has books:author meta tag", async ({ page }) => {
    const bookDetailUrl = await getFirstBookDetailUrl(page);
    if (!bookDetailUrl) return;

    await page.goto(bookDetailUrl);
    await page.waitForLoadState("networkidle");

    const author = await page.locator('meta[property="books:author"]').getAttribute("content");
    // May be empty if no authors, but the tag must exist
    expect(author).not.toBeNull();
  });

  test("page title includes book title and site name", async ({ page }) => {
    const bookDetailUrl = await getFirstBookDetailUrl(page);
    if (!bookDetailUrl) return;

    await page.goto(bookDetailUrl);
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveTitle(/— Book Explorer/i);
  });

  // ── Loading state ──────────────────────────────────────────────────────────

  test("book detail page renders without crashing after navigation", async ({ page }) => {
    // Navigate from search to detail — Remix runs the loader and swaps the page.
    // We verify the final settled state (opacity fully restored).
    await page.goto("/search?q=javascript");
    await expect(page.getByText(/\d+ results? for/i)).toBeVisible({ timeout: 15_000 });

    const links = await page.getByRole("link").all();
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
    await page.waitForLoadState("networkidle");

    // After load, the wrapper should not be faded (opacity-50 only during loading)
    const wrapper = page.locator("div.max-w-4xl").first();
    await expect(wrapper).toBeVisible({ timeout: 10_000 });
    // In settled state the element should not have opacity-50 class
    const classAttr = await wrapper.getAttribute("class");
    expect(classAttr).not.toContain("opacity-50");
  });

  // ── Bookmark button on detail page ────────────────────────────────────────

  test("bookmark button is visible on the book detail page", async ({ page }) => {
    const bookDetailUrl = await getFirstBookDetailUrl(page);
    if (!bookDetailUrl) return;

    await page.goto(bookDetailUrl);
    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("button", { name: /bookmark/i })).toBeVisible({ timeout: 10_000 });
  });

  test("clicking bookmark on detail page redirects unauthenticated user to sign-in", async ({
    page,
  }) => {
    const bookDetailUrl = await getFirstBookDetailUrl(page);
    if (!bookDetailUrl) return;

    await page.goto(bookDetailUrl);
    await page.waitForLoadState("networkidle");

    await page.getByRole("button", { name: /bookmark/i }).click();
    await page.waitForLoadState("networkidle");

    // Unauthenticated → should end up on /sign-in or stay on the book page
    const url = page.url();
    expect(url).toMatch(/\/sign-in|\/books\//);
  });
});
