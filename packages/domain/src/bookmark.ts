import type { BookId } from "./book.js";

export type BookmarkId = string;
export type UserId = string;

export type Bookmark = {
  readonly id: BookmarkId;
  readonly userId: UserId;
  readonly bookId: BookId;
  readonly bookTitle: string;
  readonly bookCoverUrl: string | null;
  readonly bookAuthors: readonly string[];
  readonly createdAt: Date;
};

export type CreateBookmarkInput = {
  readonly userId: UserId;
  readonly bookId: BookId;
  readonly bookTitle: string;
  readonly bookCoverUrl: string | null;
  readonly bookAuthors: readonly string[];
};

export type RemoveBookmarkInput = {
  readonly userId: UserId;
  readonly bookmarkId: BookmarkId;
};
