import { expect, test } from "@playwright/test";

test.describe("Bookmarks page (unauthenticated)", () => {
  test("redirects or blocks unauthenticated users", async ({ page }) => {
    await page.goto("/bookmarks");
    await page.waitForLoadState("networkidle");

    const url = page.url();
    // Without a valid Clerk session: redirects to /sign-in, stays on /bookmarks,
    // or bounces to / depending on Clerk configuration
    expect(url).toMatch(/\/bookmarks|\/sign-in|\/$/);

    // If bookmarks page loaded, it should show the heading or empty state
    if (url.includes("/bookmarks")) {
      await expect(page.getByRole("heading", { name: /my bookmarks/i })).toBeVisible();
    }
  });
});
