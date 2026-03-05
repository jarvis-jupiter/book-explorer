import type { Page } from "@playwright/test";

export class SearchPage {
  constructor(private readonly page: Page) {}

  async goto(query?: string) {
    await this.page.goto(query ? `/search?q=${encodeURIComponent(query)}` : "/search");
  }

  async search(query: string) {
    await this.page.getByRole("searchbox", { name: /search query/i }).fill(query);
    await this.page.getByRole("button", { name: /search/i }).click();
  }

  async waitForResults() {
    await this.page.waitForLoadState("networkidle");
  }

  getResultCount() {
    return this.page.getByText(/\d+ results? for/i);
  }

  async getBookCards() {
    return this.page.getByRole("listitem").all();
  }

  getSearchInput() {
    return this.page.getByRole("searchbox", { name: /search query/i });
  }

  getFirstBookmarkButton() {
    return this.page.getByRole("button", { name: /bookmark/i }).first();
  }
}
