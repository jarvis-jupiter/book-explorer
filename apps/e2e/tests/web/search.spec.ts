import { expect, test } from "@playwright/test";

test.describe("Search page", () => {
  test("renders the search form on load", async ({ page }) => {
    await page.goto("/search");

    await expect(page).toHaveTitle(/search books/i);
    await expect(page.getByRole("searchbox", { name: /search query/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /search/i })).toBeVisible();
  });

  test("shows no results text when query is absent", async ({ page }) => {
    await page.goto("/search");

    // No results summary should not be present when there's no query
    await expect(page.getByText(/results for/i)).not.toBeVisible();
  });

  test("shows results after submitting a search", async ({ page }) => {
    await page.goto("/search");

    await page.getByRole("searchbox", { name: /search query/i }).fill("javascript");
    await page.getByRole("button", { name: /search/i }).click();

    // Wait for loader to complete (navigation state → idle)
    await expect(page.getByText(/results for/i)).toBeVisible({ timeout: 15_000 });

    // At least one book card should appear
    const bookItems = page.getByRole("listitem");
    await expect(bookItems.first()).toBeVisible({ timeout: 15_000 });
  });

  test("accepts query via URL param and shows results", async ({ page }) => {
    await page.goto("/search?q=python");

    await expect(page.getByText(/results for/i)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("searchbox", { name: /search query/i })).toHaveValue("python");
  });

  test("completes a search for an obscure query without crashing", async ({ page }) => {
    // Verifies the full search flow completes (loader → render) for any query.
    // Google Books may still return partial matches, so we just check the page settles.
    await page.goto("/search?q=xkzjqwpvmlsnthgbr");

    // Wait for the loader to finish — either results summary or empty state appears
    await page.waitForLoadState("networkidle");
    // The page should have settled and still show the search form
    await expect(page.getByRole("searchbox", { name: /search query/i })).toHaveValue(
      "xkzjqwpvmlsnthgbr",
    );
  });
});
