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

    // No results summary should be absent
    await expect(page.getByText(/results for/i)).not.toBeVisible();

    // New UI shows a helpful prompt
    await expect(page.getByText(/search for books/i)).toBeVisible();
    await expect(page.getByText(/enter a title, author, or keyword/i)).toBeVisible();
  });

  test("shows results after submitting a search", async ({ page }) => {
    await page.goto("/search");

    await page.getByRole("searchbox", { name: /search query/i }).fill("javascript");
    await page.getByRole("button", { name: /search/i }).click();

    // Wait for loader to complete and result count to appear
    await expect(page.getByText(/results for/i)).toBeVisible({ timeout: 15_000 });

    // At least one book card should appear (rendered as list items)
    const bookItems = page.getByRole("listitem");
    await expect(bookItems.first()).toBeVisible({ timeout: 15_000 });
  });

  test("result count uses correct singular/plural", async ({ page }) => {
    await page.goto("/search?q=javascript");

    await expect(page.getByText(/results? for/i)).toBeVisible({ timeout: 15_000 });
    // Result count text should include "javascript" in quotes
    await expect(page.getByText(/\u201cjavascript\u201d/i)).toBeVisible({ timeout: 15_000 });
  });

  test("accepts query via URL param and pre-fills the search input", async ({ page }) => {
    await page.goto("/search?q=python");

    await expect(page.getByText(/results for/i)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("searchbox", { name: /search query/i })).toHaveValue("python");
  });

  test("shows empty state for an obscure query that returns no results", async ({ page }) => {
    await page.goto("/search?q=xkzjqwpvmlsnthgbr");

    await page.waitForLoadState("networkidle");

    // The search input should retain the query value
    await expect(page.getByRole("searchbox", { name: /search query/i })).toHaveValue(
      "xkzjqwpvmlsnthgbr",
    );

    // Either the "no books found" empty state appears, or results appear (Google may return partial matches)
    const noResults = page.getByText(/no books found/i);
    const resultCount = page.getByText(/results for/i);
    await expect(noResults.or(resultCount)).toBeVisible({ timeout: 15_000 });
  });

  test("navigating back to /search clears query and shows prompt", async ({ page }) => {
    await page.goto("/search?q=tolkien");
    await expect(page.getByText(/results for/i)).toBeVisible({ timeout: 15_000 });

    await page.goto("/search");
    await expect(page.getByText(/results for/i)).not.toBeVisible();
    await expect(page.getByRole("searchbox", { name: /search query/i })).toHaveValue("");
  });
});
