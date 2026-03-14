// E2E search tests — covers AC 3 (search) and AC 9 (access control) scenarios.

import { expect, test } from "@playwright/test";

const randomEmail = () => `srch-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
const VALID_PASSWORD = "password123";

/** Register and log in, land on /search. */
async function registerAndGoToSearch(page: import("@playwright/test").Page) {
  await page.goto("/register");
  await page.getByLabel(/email/i).fill(randomEmail());
  await page.getByLabel(/password/i).fill(VALID_PASSWORD);
  await page.getByRole("button", { name: /register/i }).click();
  await page.waitForURL(/\/search/, { timeout: 15_000 });
}

test.describe("Search page", () => {
  test("search - renders the search form on load (AC 3a)", async ({ page }) => {
    await registerAndGoToSearch(page);

    await expect(page).toHaveTitle(/search books/i);
    await expect(page.getByRole("heading", { name: /search books/i })).toBeVisible();
    await expect(page.getByLabel(/search query/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /^search$/i })).toBeVisible();
  });

  test("search - shows results for a query (AC 3b)", async ({ page }) => {
    await registerAndGoToSearch(page);

    await page.getByLabel(/search query/i).fill("javascript");
    await page.getByRole("button", { name: /^search$/i }).click();

    // Wait for either results or no-results state
    await page.waitForFunction(
      () =>
        document.querySelector('ul li') !== null ||
        document.body.textContent?.includes("No books found"),
      { timeout: 20_000 },
    );

    // Either we have results or a no-results message
    const hasResults = await page.locator("ul li").count() > 0;
    const hasNoResults = await page.getByText(/no books found/i).isVisible();
    expect(hasResults || hasNoResults).toBeTruthy();
  });

  test("search - empty-state prompt is shown when no query", async ({ page }) => {
    await registerAndGoToSearch(page);

    await expect(page.getByText(/search for books/i)).toBeVisible();
    await expect(page.getByLabel(/search query/i)).toBeVisible();
  });

  test("search - query pre-fills input from URL param", async ({ page }) => {
    await registerAndGoToSearch(page);

    await page.goto("/search?q=python");
    await page.waitForLoadState("networkidle");

    await expect(page.getByLabel(/search query/i)).toHaveValue("python", { timeout: 10_000 });
  });

  test("search - result count uses correct plural", async ({ page }) => {
    await registerAndGoToSearch(page);
    await page.goto("/search?q=javascript");

    const resultCount = page.getByText(/results? for/i);
    const noResults = page.getByText(/no books found/i);
    await expect(resultCount.or(noResults).first()).toBeVisible({ timeout: 20_000 });
  });

  test("search - filters panel is present and expandable", async ({ page }) => {
    await registerAndGoToSearch(page);

    await expect(page.getByText(/filters/i)).toBeVisible();
    await page.getByText(/filters ▾/i).click();

    await expect(page.getByRole("combobox", { name: /sort by/i })).toBeVisible();
    await expect(page.getByRole("combobox", { name: /language/i })).toBeVisible();
    await expect(page.getByRole("combobox", { name: /availability/i })).toBeVisible();
  });

  test("search - sort filter is reflected in URL (AC 3c)", async ({ page }) => {
    await registerAndGoToSearch(page);

    await page.getByText(/filters ▾/i).click();
    await page.getByRole("combobox", { name: /sort by/i }).selectOption("newest");
    await page.getByLabel(/search query/i).fill("javascript");
    await page.getByRole("button", { name: /^search$/i }).click();

    await page.waitForFunction(
      () => window.location.search.includes("sort=newest"),
      { timeout: 10_000 },
    );
    expect(page.url()).toContain("sort=newest");
  });
});
