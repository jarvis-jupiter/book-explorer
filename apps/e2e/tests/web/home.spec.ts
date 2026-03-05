import { expect, test } from "../../src/fixtures/index.js";

test.describe("Home page", () => {
  test("loads and displays the hero heading", async ({ homePage }) => {
    await homePage.goto();

    await expect(homePage.page).toHaveTitle("Book Explorer");
    await expect(homePage.getTitle()).toBeVisible();
  });

  test("displays the hero subtext", async ({ homePage }) => {
    await homePage.goto();

    await expect(homePage.page.getByText(/discover.*search.*bookmark/i)).toBeVisible();
  });

  test("displays the stats row", async ({ homePage }) => {
    await homePage.goto();

    await expect(homePage.page.getByText(/1M\+ Books/)).toBeVisible();
    await expect(homePage.page.getByText(/Google Books Powered/)).toBeVisible();
    await expect(homePage.page.getByText(/Free Forever/)).toBeVisible();
  });

  test("has a working 'Search Books' link", async ({ homePage }) => {
    await homePage.goto();
    await homePage.clickSearchBooks();

    await expect(homePage.page).toHaveURL(/\/search/);
    await expect(homePage.page.getByRole("heading", { name: /search books/i })).toBeVisible();
  });

  test("has a working 'My Bookmarks' link", async ({ homePage }) => {
    await homePage.goto();
    await homePage.clickMyBookmarks();

    await homePage.page.waitForLoadState("networkidle");
    const url = homePage.page.url();
    expect(url).toMatch(/\/bookmarks|\/sign-in|\/$/);
  });

  test("nav contains Search and Bookmarks links", async ({ homePage }) => {
    await homePage.goto();

    await expect(homePage.getNavLink(/^search$/i)).toBeVisible();
    await expect(homePage.getNavLink(/^bookmarks$/i)).toBeVisible();
  });

  test("nav has a Sign In button when unauthenticated", async ({ homePage }) => {
    await homePage.goto();

    await expect(homePage.page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });
});
