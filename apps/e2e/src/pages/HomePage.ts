import type { Page } from "@playwright/test";

export class HomePage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto("/");
  }

  async clickSearchBooks() {
    await this.page.getByRole("link", { name: /search books/i }).click();
  }

  async clickMyBookmarks() {
    await this.page.getByRole("link", { name: /my bookmarks/i }).click();
  }

  getTitle() {
    return this.page.getByRole("heading", { level: 1 });
  }

  getNavLink(name: RegExp | string) {
    return this.page.getByRole("navigation").getByRole("link", { name });
  }
}
