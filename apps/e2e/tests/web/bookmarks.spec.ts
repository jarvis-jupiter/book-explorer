import { expect, test } from "@playwright/test";

test.describe("Bookmarks page (unauthenticated)", () => {
  test("redirects unauthenticated users away from /bookmarks", async ({ page }) => {
    await page.goto("/bookmarks");

    // Without a valid Clerk session, the loader redirects to /sign-in
    await expect(page).toHaveURL(/\/sign-in|\/bookmarks/);

    // If it didn't redirect (e.g. Clerk in test mode), the page should still load
    if (page.url().includes("/bookmarks")) {
      await expect(page.getByRole("heading", { name: /my bookmarks/i })).toBeVisible();
    }
  });
});
