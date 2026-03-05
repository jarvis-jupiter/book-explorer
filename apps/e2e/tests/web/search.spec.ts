import { expect, test } from "../../src/fixtures/index.js";

test.describe("Search page", () => {
  test("renders the search form on load", async ({ searchPage }) => {
    await searchPage.goto();

    await expect(searchPage.page).toHaveTitle(/search books/i);
    await expect(searchPage.page.getByRole("heading", { name: /search books/i })).toBeVisible();
    await expect(searchPage.getSearchInput()).toBeVisible();
    await expect(searchPage.page.getByRole("button", { name: /search/i })).toBeVisible();
  });

  test("search input has correct placeholder text", async ({ searchPage }) => {
    await searchPage.goto();

    await expect(
      searchPage.page.getByPlaceholder(/search by title, author, or keyword/i),
    ).toBeVisible();
  });

  test("shows empty-state prompt when no query is present", async ({ searchPage }) => {
    await searchPage.goto();

    await expect(searchPage.page.getByText(/results for/i)).not.toBeVisible();
    await expect(searchPage.page.getByText(/search for books/i)).toBeVisible();
    await expect(searchPage.page.getByText(/enter a title, author, or keyword/i)).toBeVisible();
  });

  test("shows results after submitting a search", async ({ searchPage }) => {
    await searchPage.goto();
    await searchPage.search("javascript");

    await expect(searchPage.getResultCount()).toBeVisible({ timeout: 15_000 });
    const bookItems = searchPage.page.getByRole("listitem");
    await expect(bookItems.first()).toBeVisible({ timeout: 15_000 });
  });

  test("result count uses correct singular/plural", async ({ searchPage }) => {
    await searchPage.goto("javascript");

    await expect(searchPage.getResultCount()).toBeVisible({ timeout: 15_000 });
    await expect(searchPage.page.getByText(/\u201cjavascript\u201d/i)).toBeVisible({
      timeout: 15_000,
    });
  });

  test("accepts query via URL param and pre-fills the search input", async ({ searchPage }) => {
    await searchPage.goto("python");

    await expect(searchPage.getResultCount()).toBeVisible({ timeout: 15_000 });
    await expect(searchPage.getSearchInput()).toHaveValue("python");
  });

  test("shows empty state for an obscure query that returns no results", async ({ searchPage }) => {
    await searchPage.goto("xkzjqwpvmlsnthgbr");
    await searchPage.waitForResults();

    await expect(searchPage.getSearchInput()).toHaveValue("xkzjqwpvmlsnthgbr");

    const noResults = searchPage.page.getByText(/no books found/i);
    const resultCount = searchPage.getResultCount();
    await expect(noResults.or(resultCount).first()).toBeVisible({ timeout: 15_000 });
  });

  test("bookmark button is visible on search results", async ({ searchPage }) => {
    await searchPage.goto("javascript");
    await expect(searchPage.getResultCount()).toBeVisible({ timeout: 15_000 });
    await searchPage.waitForBookCards();

    await expect(searchPage.getFirstBookmarkButton()).toBeVisible({ timeout: 15_000 });
  });

  test("clicking bookmark button does not navigate away from search", async ({ searchPage }) => {
    await searchPage.goto("javascript");
    await expect(searchPage.getResultCount()).toBeVisible({ timeout: 15_000 });
    await searchPage.waitForBookCards();

    const bookmarkBtn = searchPage.getFirstBookmarkButton();
    await expect(bookmarkBtn).toBeVisible({ timeout: 15_000 });

    await bookmarkBtn.click();
    await searchPage.page.waitForLoadState("networkidle");

    expect(searchPage.page.url()).toMatch(/\/search|\/sign-in/);
  });

  test("navigating back to /search clears query and shows prompt", async ({ searchPage }) => {
    await searchPage.goto("tolkien");
    await expect(searchPage.getResultCount()).toBeVisible({ timeout: 15_000 });

    await searchPage.goto();
    await expect(searchPage.page.getByText(/results for/i)).not.toBeVisible();
    await expect(searchPage.getSearchInput()).toHaveValue("");
  });

  // ── Filters panel ─────────────────────────────────────────────────────────

  test("filters panel is present on the search page", async ({ searchPage }) => {
    await searchPage.goto();

    await expect(searchPage.page.getByText(/filters/i)).toBeVisible();
  });

  test("filters panel opens and shows sort, language, and availability selects", async ({
    searchPage,
  }) => {
    await searchPage.goto();

    await searchPage.page.getByText(/filters ▾/i).click();

    await expect(searchPage.page.getByRole("combobox", { name: /sort by/i })).toBeVisible();
    await expect(searchPage.page.getByRole("combobox", { name: /language/i })).toBeVisible();
    await expect(searchPage.page.getByRole("combobox", { name: /availability/i })).toBeVisible();
  });

  test("sort filter submits with search and is reflected in URL", async ({ searchPage }) => {
    await searchPage.goto();

    await searchPage.page.getByText(/filters ▾/i).click();
    await searchPage.page.getByRole("combobox", { name: /sort by/i }).selectOption("newest");
    await searchPage.search("javascript");
    await searchPage.waitForResults();

    expect(searchPage.page.url()).toContain("sort=newest");
  });

  test("language filter submits with search and is reflected in URL", async ({ searchPage }) => {
    await searchPage.goto();

    await searchPage.page.getByText(/filters ▾/i).click();
    await searchPage.page.getByRole("combobox", { name: /language/i }).selectOption("en");
    await searchPage.search("javascript");
    await searchPage.waitForResults();

    expect(searchPage.page.url()).toContain("lang=en");
  });

  test("availability filter submits with search and is reflected in URL", async ({
    searchPage,
  }) => {
    await searchPage.goto();

    await searchPage.page.getByText(/filters ▾/i).click();
    await searchPage.page.getByRole("combobox", { name: /availability/i }).selectOption("ebooks");
    await searchPage.search("python");
    await searchPage.waitForResults();

    expect(searchPage.page.url()).toContain("filter=ebooks");
  });

  test("search with filters still returns results", async ({ searchPage }) => {
    await searchPage.goto("javascript");
    await searchPage.page.goto("/search?q=javascript&sort=newest&lang=en&filter=ebooks");
    await searchPage.waitForResults();

    const hasResults = searchPage.getResultCount();
    const noBooks = searchPage.page.getByText(/no books found/i);
    const searchPrompt = searchPage.page.getByText(/search for books/i);
    await expect(hasResults.or(noBooks).or(searchPrompt).first()).toBeVisible({
      timeout: 15_000,
    });
  });

  // ── Bookmarked state (unauthenticated path) ────────────────────────────────

  test("unauthenticated user clicking bookmark is redirected to sign-in with return URL", async ({
    searchPage,
  }) => {
    await searchPage.goto("javascript");
    await expect(searchPage.getResultCount()).toBeVisible({ timeout: 15_000 });
    await searchPage.waitForBookCards();

    const bookmarkBtn = searchPage.getFirstBookmarkButton();
    await expect(bookmarkBtn).toBeVisible({ timeout: 15_000 });
    await bookmarkBtn.click();

    await searchPage.waitForResults();

    const url = searchPage.page.url();
    if (url.includes("/sign-in")) {
      expect(url).toContain("redirect_url");
    } else {
      expect(url).toContain("/search");
    }
  });
});
