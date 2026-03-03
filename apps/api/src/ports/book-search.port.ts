import type { BookSearchResult, SearchBooksQuery } from "@book-explorer/domain";
import type { Result } from "../domain/result.js";

// Port (interface) — inbound: what the use case exposes to callers

export type BookSearchPort = {
  readonly searchBooks: (query: SearchBooksQuery) => Promise<Result<BookSearchResult>>;
};
