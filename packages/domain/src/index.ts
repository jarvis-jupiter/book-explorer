// Zod schemas — single source of truth for domain types
export {
  BookSchema,
  BookSearchResultSchema,
  SearchBooksQuerySchema,
  BookmarkSchema,
  CreateBookmarkInputSchema,
  RemoveBookmarkInputSchema,
} from "./schemas.js";

// Inferred types (re-exported for convenience)
export type {
  Book,
  BookId,
  BookSearchResult,
  SearchBooksQuery,
  Bookmark,
  BookmarkId,
  UserId,
  CreateBookmarkInput,
  RemoveBookmarkInput,
} from "./schemas.js";

export type { User } from "./user.js";
