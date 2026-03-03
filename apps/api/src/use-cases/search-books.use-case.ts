import type { BookSearchResult, SearchBooksQuery } from "@book-explorer/domain";
import { validationError } from "../domain/errors.js";
import type { Result } from "../domain/result.js";
import { err } from "../domain/result.js";
import type { BookRepositoryPort } from "../ports/book-repository.port.js";

export type SearchBooksUseCase = {
  readonly execute: (query: SearchBooksQuery) => Promise<Result<BookSearchResult>>;
};

export const createSearchBooksUseCase = (
  bookRepository: BookRepositoryPort,
): SearchBooksUseCase => ({
  execute: async (query: SearchBooksQuery): Promise<Result<BookSearchResult>> => {
    if (!query.query || query.query.trim().length === 0) {
      return err(validationError("Search query must not be empty"));
    }

    const trimmedQuery: SearchBooksQuery = {
      query: query.query.trim(),
      page: query.page ?? 1,
      pageSize: Math.min(query.pageSize ?? 10, 40),
    };

    return bookRepository.search(trimmedQuery);
  },
});
