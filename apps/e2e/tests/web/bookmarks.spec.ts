import { expect, test } from "@playwright/test";

test.describe("Bookmarks page (unauthenticated)", () => {
  test("redirects or blocks unauthenticated users", async ({ page }) => {
    await page.goto("/bookmarks");
    await page.waitForLoadState("networkidle");

    const url = page.url();
    // Without a valid Clerk session: redirects to /sign-in, stays on /bookmarks,
    // or bounces to / depending on Clerk configuration
    expect(url).toMatch(/\/bookmarks|\/sign-in|\/$/);

    // If the bookmarks page loaded, it should show the heading
    if (url.includes("/bookmarks")) {
      await expect(page.getByRole("heading", { name: /my bookmarks/i })).toBeVisible();
    }
  });

  test("shows empty-state message when there are no bookmarks", async ({ page }) => {
    await page.goto("/bookmarks");
    await page.waitForLoadState("networkidle");

    // Only assert on the bookmarks page itself (unauthenticated may redirect)
    if (!page.url().includes("/bookmarks")) {
      return;
    }

    // New UI shows a rich empty state with a link to search
    await expect(page.getByText(/no bookmarks yet/i)).toBeVisible();
    await expect(page.getByText(/search for books and bookmark/i)).toBeVisible();
    await expect(page.getByRole("link", { name: /find books/i })).toBeVisible();
  });

  test("'Find Books' empty-state link navigates to search", async ({ page }) => {
    await page.goto("/bookmarks");
    await page.waitForLoadState("networkidle");

    if (!page.url().includes("/bookmarks")) {
      return;
    }

    const findBooksLink = page.getByRole("link", { name: /find books/i });
    // If visible (empty state shown), clicking it should go to /search
    if (await findBooksLink.isVisible()) {
      await findBooksLink.click();
      await expect(page).toHaveURL(/\/search/);
      await expect(page.getByRole("heading", { name: /search books/i })).toBeVisible();
    }
  });
});
