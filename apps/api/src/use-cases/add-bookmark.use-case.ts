import type { Bookmark, CreateBookmarkInput } from "@book-explorer/domain";
import { conflict, validationError } from "../domain/errors.js";
import type { Result } from "../domain/result.js";
import { err } from "../domain/result.js";
import type { BookmarkRepositoryPort } from "../ports/bookmark-repository.port.js";

export type AddBookmarkUseCase = {
  readonly execute: (input: CreateBookmarkInput) => Promise<Result<Bookmark>>;
};

export const createAddBookmarkUseCase = (
  bookmarkRepository: BookmarkRepositoryPort,
): AddBookmarkUseCase => ({
  execute: async (input: CreateBookmarkInput): Promise<Result<Bookmark>> => {
    if (!input.bookId || input.bookId.trim().length === 0) {
      return err(validationError("Book ID must not be empty"));
    }

    if (!input.userId || input.userId.trim().length === 0) {
      return err(validationError("User ID must not be empty"));
    }

    if (!input.bookTitle || input.bookTitle.trim().length === 0) {
      return err(validationError("Book title must not be empty"));
    }

    // Check for duplicate
    const existingResult = await bookmarkRepository.findByUserAndBook(input.userId, input.bookId);
    if (existingResult.ok && existingResult.value !== null) {
      return err(conflict("Book is already bookmarked"));
    }

    return bookmarkRepository.create(input);
  },
});
