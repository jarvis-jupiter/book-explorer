import type { BookSearchResult, SearchBooksQuery } from "@book-explorer/domain";
import type { Result } from "../domain/result.js";

// Outbound port — what the use case needs from external book source

export type BookRepositoryPort = {
  readonly search: (query: SearchBooksQuery) => Promise<Result<BookSearchResult>>;
};
