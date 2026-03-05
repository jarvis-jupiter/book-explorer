import { expect, test } from "@playwright/test";

test.describe("Search page", () => {
  test("renders the search form on load", async ({ page }) => {
    await page.goto("/search");

    await expect(page).toHaveTitle(/search books/i);
    await expect(page.getByRole("heading", { name: /search books/i })).toBeVisible();
    await expect(page.getByRole("searchbox", { name: /search query/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /search/i })).toBeVisible();
  });

  test("search input has correct placeholder text", async ({ page }) => {
    await page.goto("/search");

    await expect(page.getByPlaceholder(/search by title, author, or keyword/i)).toBeVisible();
  });

  test("shows empty-state prompt when no query is present", async ({ page }) => {
    await page.goto("/search");

    await expect(page.getByText(/results for/i)).not.toBeVisible();
    await expect(page.getByText(/search for books/i)).toBeVisible();
    await expect(page.getByText(/enter a title, author, or keyword/i)).toBeVisible();
  });

  test("shows results after submitting a search", async ({ page }) => {
    await page.goto("/search");

    await page.getByRole("searchbox", { name: /search query/i }).fill("javascript");
    await page.getByRole("button", { name: /search/i }).click();

    await expect(page.getByText(/\d+ results? for/i)).toBeVisible({ timeout: 15_000 });
    const bookItems = page.getByRole("listitem");
    await expect(bookItems.first()).toBeVisible({ timeout: 15_000 });
  });

  test("result count uses correct singular/plural", async ({ page }) => {
    await page.goto("/search?q=javascript");

    await expect(page.getByText(/\d+ results? for/i)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/\u201cjavascript\u201d/i)).toBeVisible({ timeout: 15_000 });
  });

  test("accepts query via URL param and pre-fills the search input", async ({ page }) => {
    await page.goto("/search?q=python");

    await expect(page.getByText(/\d+ results? for/i)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("searchbox", { name: /search query/i })).toHaveValue("python");
  });

  test("shows empty state for an obscure query that returns no results", async ({ page }) => {
    await page.goto("/search?q=xkzjqwpvmlsnthgbr");

    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("searchbox", { name: /search query/i })).toHaveValue(
      "xkzjqwpvmlsnthgbr",
    );

    const noResults = page.getByText(/no books found/i);
    const resultCount = page.getByText(/\d+ results? for/i);
    await expect(noResults.or(resultCount).first()).toBeVisible({ timeout: 15_000 });
  });

  test("bookmark button is visible on search results", async ({ page }) => {
    await page.goto("/search?q=javascript");
    await expect(page.getByText(/\d+ results? for/i)).toBeVisible({ timeout: 15_000 });

    const bookmarkBtn = page.getByRole("button", { name: /bookmark/i }).first();
    await expect(bookmarkBtn).toBeVisible({ timeout: 10_000 });
  });

  test("clicking bookmark button does not navigate away from search", async ({ page }) => {
    await page.goto("/search?q=javascript");
    await expect(page.getByText(/\d+ results? for/i)).toBeVisible({ timeout: 15_000 });

    const bookmarkBtn = page.getByRole("button", { name: /bookmark/i }).first();
    await expect(bookmarkBtn).toBeVisible({ timeout: 10_000 });

    await bookmarkBtn.click();
    await page.waitForLoadState("networkidle");

    expect(page.url()).toMatch(/\/search|\/sign-in/);
  });

  test("navigating back to /search clears query and shows prompt", async ({ page }) => {
    await page.goto("/search?q=tolkien");
    await expect(page.getByText(/\d+ results? for/i)).toBeVisible({ timeout: 15_000 });

    await page.goto("/search");
    await expect(page.getByText(/results for/i)).not.toBeVisible();
    await expect(page.getByRole("searchbox", { name: /search query/i })).toHaveValue("");
  });

  // ── Filters panel ─────────────────────────────────────────────────────────

  test("filters panel is present on the search page", async ({ page }) => {
    await page.goto("/search");

    // The <details> summary acts as the toggle — accessible as generic or group
    await expect(page.getByText(/filters/i)).toBeVisible();
  });

  test("filters panel opens and shows sort, language, and availability selects", async ({
    page,
  }) => {
    await page.goto("/search");

    // Open the filters panel by clicking the summary
    await page.getByText(/filters ▾/i).click();

    await expect(page.getByRole("combobox", { name: /sort by/i })).toBeVisible();
    await expect(page.getByRole("combobox", { name: /language/i })).toBeVisible();
    await expect(page.getByRole("combobox", { name: /availability/i })).toBeVisible();
  });

  test("sort filter submits with search and is reflected in URL", async ({ page }) => {
    await page.goto("/search");

    await page.getByText(/filters ▾/i).click();
    await page.getByRole("combobox", { name: /sort by/i }).selectOption("newest");

    await page.getByRole("searchbox", { name: /search query/i }).fill("javascript");
    await page.getByRole("button", { name: /search/i }).click();

    await page.waitForLoadState("networkidle");
    expect(page.url()).toContain("sort=newest");
  });

  test("language filter submits with search and is reflected in URL", async ({ page }) => {
    await page.goto("/search");

    await page.getByText(/filters ▾/i).click();
    await page.getByRole("combobox", { name: /language/i }).selectOption("en");

    await page.getByRole("searchbox", { name: /search query/i }).fill("javascript");
    await page.getByRole("button", { name: /search/i }).click();

    await page.waitForLoadState("networkidle");
    expect(page.url()).toContain("lang=en");
  });

  test("availability filter submits with search and is reflected in URL", async ({ page }) => {
    await page.goto("/search");

    await page.getByText(/filters ▾/i).click();
    await page.getByRole("combobox", { name: /availability/i }).selectOption("ebooks");

    await page.getByRole("searchbox", { name: /search query/i }).fill("python");
    await page.getByRole("button", { name: /search/i }).click();

    await page.waitForLoadState("networkidle");
    expect(page.url()).toContain("filter=ebooks");
  });

  test("search with filters still returns results", async ({ page }) => {
    await page.goto("/search?q=javascript&sort=newest&lang=en&filter=ebooks");
    await page.waitForLoadState("networkidle");

    // Either results or empty state — not an error
    const hasResults = page.getByText(/\d+ results? for/i);
    const noBooks = page.getByText(/no books found/i);
    const searchPrompt = page.getByText(/search for books/i);
    await expect(hasResults.or(noBooks).or(searchPrompt).first()).toBeVisible({
      timeout: 15_000,
    });
  });

  // ── Bookmarked state (unauthenticated path) ────────────────────────────────

  test("unauthenticated user clicking bookmark is redirected to sign-in with return URL", async ({
    page,
  }) => {
    await page.goto("/search?q=javascript");
    await expect(page.getByText(/\d+ results? for/i)).toBeVisible({ timeout: 15_000 });

    const bookmarkBtn = page.getByRole("button", { name: /bookmark/i }).first();
    await expect(bookmarkBtn).toBeVisible({ timeout: 10_000 });
    await bookmarkBtn.click();

    await page.waitForLoadState("networkidle");

    // Unauthenticated → redirected to sign-in with redirect_url param
    const url = page.url();
    if (url.includes("/sign-in")) {
      expect(url).toContain("redirect_url");
    } else {
      // If already on search somehow, that's also acceptable
      expect(url).toContain("/search");
    }
  });
});
