import type { Bookmark, BookmarkId, CreateBookmarkInput, UserId } from "@book-explorer/domain";
import type { Result } from "../domain/result.js";

// Outbound port — what the use case needs from bookmark storage

export type BookmarkRepositoryPort = {
  readonly findById: (id: BookmarkId) => Promise<Result<Bookmark>>;
  readonly findByUserId: (userId: UserId) => Promise<Result<readonly Bookmark[]>>;
  readonly findByUserAndBook: (userId: UserId, bookId: string) => Promise<Result<Bookmark | null>>;
  readonly create: (input: CreateBookmarkInput) => Promise<Result<Bookmark>>;
  readonly deleteById: (id: BookmarkId) => Promise<Result<void>>;
};
