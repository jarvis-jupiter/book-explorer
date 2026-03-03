import type {
  Bookmark,
  BookmarkId,
  CreateBookmarkInput,
  RemoveBookmarkInput,
  UserId,
} from "@book-explorer/domain";
import type { Result } from "../domain/result.js";

// Inbound ports — use-case interfaces

export type BookmarkPort = {
  readonly addBookmark: (input: CreateBookmarkInput) => Promise<Result<Bookmark>>;
  readonly removeBookmark: (input: RemoveBookmarkInput) => Promise<Result<void>>;
  readonly listBookmarks: (userId: UserId) => Promise<Result<readonly Bookmark[]>>;
  readonly getBookmark: (userId: UserId, bookmarkId: BookmarkId) => Promise<Result<Bookmark>>;
};
