import type { RemoveBookmarkInput } from "@book-explorer/domain";
import { forbidden, notFound } from "../domain/errors.js";
import type { Result } from "../domain/result.js";
import { err } from "../domain/result.js";
import type { BookmarkRepositoryPort } from "../ports/bookmark-repository.port.js";

export type RemoveBookmarkUseCase = {
  readonly execute: (input: RemoveBookmarkInput) => Promise<Result<void>>;
};

export const createRemoveBookmarkUseCase = (
  bookmarkRepository: BookmarkRepositoryPort,
): RemoveBookmarkUseCase => ({
  execute: async (input: RemoveBookmarkInput): Promise<Result<void>> => {
    const bookmarkResult = await bookmarkRepository.findById(input.bookmarkId);

    if (!bookmarkResult.ok) {
      return err(notFound("Bookmark not found"));
    }

    if (bookmarkResult.value.userId !== input.userId) {
      return err(forbidden("You do not own this bookmark"));
    }

    return bookmarkRepository.deleteById(input.bookmarkId);
  },
});
