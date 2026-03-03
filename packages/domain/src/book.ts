export type BookId = string;

export type Book = {
  readonly id: BookId;
  readonly title: string;
  readonly authors: readonly string[];
  readonly publisher: string | null;
  readonly description: string | null;
  readonly coverUrl: string | null;
  readonly publishedDate: string | null;
  readonly pageCount: number | null;
  readonly categories: readonly string[];
  readonly averageRating: number | null;
};

export type BookSearchResult = {
  readonly books: readonly Book[];
  readonly totalItems: number;
  readonly page: number;
  readonly pageSize: number;
};

export type SearchBooksQuery = {
  readonly query: string;
  readonly page?: number;
  readonly pageSize?: number;
};
