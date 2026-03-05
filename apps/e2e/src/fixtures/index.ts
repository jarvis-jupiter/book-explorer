import { test as base } from "@playwright/test";
import { BookDetailPage } from "../pages/BookDetailPage.js";
import { HomePage } from "../pages/HomePage.js";
import { SearchPage } from "../pages/SearchPage.js";

type Fixtures = {
  homePage: HomePage;
  searchPage: SearchPage;
  bookDetailPage: BookDetailPage;
};

export const test = base.extend<Fixtures>({
  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },
  searchPage: async ({ page }, use) => {
    await use(new SearchPage(page));
  },
  bookDetailPage: async ({ page }, use) => {
    await use(new BookDetailPage(page));
  },
});

export { expect } from "@playwright/test";
