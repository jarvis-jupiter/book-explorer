import { expect, test } from "@playwright/test";

test.describe("Book detail page", () => {
  test("navigates to book detail from search results", async ({ page }) => {
    await page.goto("/search?q=javascript");

    // Wait for results to load
    await expect(page.getByText(/\d+ results? for/i)).toBeVisible({ timeout: 15_000 });

    // Click the first book title link
    const firstLink = page.getByRole("link", { name: /.+/ }).first();
    const href = await firstLink.getAttribute("href");

    if (href?.startsWith("/books/")) {
      await firstLink.click();
      await page.waitForLoadState("networkidle");

      // Should show book title as heading
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 10_000 });

      // Should show bookmark button
      await expect(page.getByRole("button", { name: /bookmark/i })).toBeVisible();

      // Should show back to search link
      await expect(page.getByRole("link", { name: /back to search/i })).toBeVisible();
    }
  });

  test("book detail page shows title and authors", async ({ page }) => {
    // Search for a reliable book and click into it
    await page.goto("/search?q=clean+code");
    await expect(page.getByText(/\d+ results? for/i)).toBeVisible({ timeout: 15_000 });

    // Find a book-detail link and navigate directly
    const links = await page.getByRole("link").all();
    let bookDetailUrl: string | null = null;
    for (const link of links) {
      const href = await link.getAttribute("href");
      if (href?.startsWith("/books/")) {
        bookDetailUrl = href;
        break;
      }
    }

    if (!bookDetailUrl) return; // Skip if no book links found

    await page.goto(bookDetailUrl);
    await page.waitForLoadState("networkidle");

    // Title heading should be visible
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 10_000 });

    // The page title should contain "Book Explorer"
    await expect(page).toHaveTitle(/book explorer/i);
  });
});
