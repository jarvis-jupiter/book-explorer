// E2E bookmark tests — covers AC 4, 5, 6 from the architecture doc.
// Requires a running backend + frontend + database.

import { expect, test } from "@playwright/test";

const randomEmail = () => `bm-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
const VALID_PASSWORD = "password123";
const SEARCH_QUERY = "javascript programming";

/** Register and log in, then navigate to search results. */
async function loginAndSearch(page: import("@playwright/test").Page, query = SEARCH_QUERY) {
  const email = randomEmail();
  await page.goto("/register");
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(VALID_PASSWORD);
  await page.getByRole("button", { name: /register/i }).click();
  await page.waitForURL(/\/search/, { timeout: 15_000 });

  // Search for books
  await page.getByLabel(/search query/i).fill(query);
  await page.getByRole("button", { name: /^search$/i }).click();
  // Wait for results to load
  await page.waitForFunction(
    () =>
      document.querySelector('ul li') !== null ||
      document.body.textContent?.includes("No books found"),
    { timeout: 20_000 },
  );

  return email;
}

// ── AC 4: Bookmark a book ─────────────────────────────────────────────────────

test.describe("Bookmark", () => {
  test("bookmark - clicking Bookmark saves book and updates button state (AC 4a)", async ({
    page,
  }) => {
    await loginAndSearch(page);

    // Find and click the first Bookmark button
    const bookmarkBtn = page.getByRole("button", { name: /bookmark/i }).first();
    await expect(bookmarkBtn).toBeVisible({ timeout: 15_000 });
    await bookmarkBtn.click();
    await page.waitForLoadState("networkidle");

    // Navigate to /bookmarks to confirm it was saved
    await page.goto("/bookmarks");
    await expect(page.getByRole("heading", { name: /my bookmarks/i })).toBeVisible();
    // At least one bookmark should now be present
    const bookmarkList = page.locator("ul li");
    await expect(bookmarkList.first()).toBeVisible({ timeout: 10_000 });
  });

  test("bookmark - clicking Bookmark on an already-bookmarked book has no effect (AC 4b)", async ({
    page,
  }) => {
    await loginAndSearch(page);

    const bookmarkBtn = page.getByRole("button", { name: /bookmark/i }).first();
    await expect(bookmarkBtn).toBeVisible({ timeout: 15_000 });

    // Bookmark it once
    await bookmarkBtn.click();
    await page.waitForLoadState("networkidle");

    // Bookmark it again
    const bookmarkBtn2 = page.getByRole("button", { name: /bookmark/i }).first();
    if (await bookmarkBtn2.isVisible()) {
      await bookmarkBtn2.click();
      await page.waitForLoadState("networkidle");
    }

    // Navigate to /bookmarks — should have exactly 1 bookmark for this book, not 2
    await page.goto("/bookmarks");
    const items = page.locator("ul li");
    const count = await items.count();
    // Should be at most 1 (idempotent)
    expect(count).toBeLessThanOrEqual(1);
  });
});

// ── AC 5: Bookmark list ───────────────────────────────────────────────────────

test.describe("Bookmark list", () => {
  test("bookmark list - shows all saved books (AC 5a)", async ({ page }) => {
    await loginAndSearch(page);

    // Bookmark the first result
    const firstBookmarkBtn = page.getByRole("button", { name: /bookmark/i }).first();
    await expect(firstBookmarkBtn).toBeVisible({ timeout: 15_000 });
    await firstBookmarkBtn.click();
    await page.waitForLoadState("networkidle");

    await page.goto("/bookmarks");
    await expect(page.getByRole("heading", { name: /my bookmarks/i })).toBeVisible();

    // At least one item should be visible with title/author
    const items = page.locator("ul li");
    await expect(items.first()).toBeVisible({ timeout: 10_000 });
    // Each item should show a title
    const titleEl = items.first().locator("h2");
    await expect(titleEl).toBeVisible();
    const titleText = await titleEl.textContent();
    expect(titleText?.length).toBeGreaterThan(0);
  });

  test("bookmark list - empty state shows prompt (AC 5b)", async ({ page }) => {
    // Register a fresh user with no bookmarks
    const email = randomEmail();
    await page.goto("/register");
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill(VALID_PASSWORD);
    await page.getByRole("button", { name: /register/i }).click();
    await page.waitForURL(/\/search/, { timeout: 15_000 });

    await page.goto("/bookmarks");
    await expect(page.getByText(/no bookmarks yet/i)).toBeVisible({ timeout: 10_000 });
  });
});

// ── AC 6: Remove bookmark ─────────────────────────────────────────────────────

test.describe("Remove bookmark", () => {
  test("remove bookmark - book is removed immediately (AC 6)", async ({ page }) => {
    await loginAndSearch(page);

    // Bookmark the first result
    const firstBookmarkBtn = page.getByRole("button", { name: /bookmark/i }).first();
    await expect(firstBookmarkBtn).toBeVisible({ timeout: 15_000 });
    await firstBookmarkBtn.click();
    await page.waitForLoadState("networkidle");

    await page.goto("/bookmarks");
    await expect(page.locator("ul li").first()).toBeVisible({ timeout: 10_000 });

    // Remove the bookmark
    const removeBtn = page.getByRole("button", { name: /remove/i }).first();
    await expect(removeBtn).toBeVisible();
    await removeBtn.click();
    await page.waitForLoadState("networkidle");

    // Should now show empty state
    await expect(page.getByText(/no bookmarks yet/i)).toBeVisible({ timeout: 10_000 });
  });
});
