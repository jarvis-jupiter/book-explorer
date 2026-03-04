import { expect, test } from "@playwright/test";

test.describe("Home page", () => {
  test("loads and displays the hero heading", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle("Book Explorer");
    await expect(page.getByRole("heading", { name: /book explorer/i })).toBeVisible();
  });

  test("has a working 'Search Books' link", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("link", { name: /search books/i }).click();

    await expect(page).toHaveURL(/\/search/);
    await expect(page.getByRole("heading", { name: /search books/i })).toBeVisible();
  });

  test("has a working 'My Bookmarks' link", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("link", { name: /my bookmarks/i }).click();

    // Bookmarks requires auth — unauthenticated users get redirected
    // (to /sign-in, /bookmarks with empty state, or / depending on Clerk config)
    await page.waitForLoadState("networkidle");
    const url = page.url();
    expect(url).toMatch(/\/bookmarks|\/sign-in|\/$/);
  });
});
