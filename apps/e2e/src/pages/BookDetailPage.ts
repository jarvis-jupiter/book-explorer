import type { Page } from "@playwright/test";

export class BookDetailPage {
  constructor(private readonly page: Page) {}

  async goto(id: string) {
    await this.page.goto(`/books/${id}`);
  }

  getTitle() {
    return this.page.getByRole("heading", { level: 1 });
  }

  getBookmarkButton() {
    return this.page.getByRole("button", { name: /bookmark/i });
  }

  getBackLink() {
    return this.page.getByRole("link", { name: /back to search/i });
  }
}
