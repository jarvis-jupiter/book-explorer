import { z } from "zod";

// ── Book ──────────────────────────────────────────────────────────────────────

export const BookSchema = z.object({
  id: z.string(),
  title: z.string(),
  authors: z.array(z.string()).readonly(),
  publisher: z.string().nullable(),
  description: z.string().nullable(),
  coverUrl: z.string().nullable(),
  publishedDate: z.string().nullable(),
  pageCount: z.number().int().nullable(),
  categories: z.array(z.string()).readonly(),
  averageRating: z.number().nullable(),
});

export type Book = z.infer<typeof BookSchema>;
export type BookId = Book["id"];

// ── BookSearchResult ──────────────────────────────────────────────────────────

export const BookSearchResultSchema = z.object({
  books: z.array(BookSchema).readonly(),
  totalItems: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
});

export type BookSearchResult = z.infer<typeof BookSearchResultSchema>;

// ── SearchBooksQuery ──────────────────────────────────────────────────────────

export const SearchBooksQuerySchema = z.object({
  query: z.string().min(1, "Search query must not be empty"),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(40).optional(),
});

export type SearchBooksQuery = z.infer<typeof SearchBooksQuerySchema>;

// ── Bookmark ──────────────────────────────────────────────────────────────────

export const BookmarkSchema = z.object({
  id: z.string(),
  userId: z.string(),
  bookId: z.string(),
  bookTitle: z.string(),
  bookCoverUrl: z.string().nullable(),
  bookAuthors: z.array(z.string()).readonly(),
  createdAt: z.date(),
});

export type Bookmark = z.infer<typeof BookmarkSchema>;
export type BookmarkId = Bookmark["id"];
export type UserId = Bookmark["userId"];

// ── CreateBookmarkInput ───────────────────────────────────────────────────────

export const CreateBookmarkInputSchema = z.object({
  userId: z.string().min(1, "userId is required"),
  bookId: z.string().min(1, "bookId is required"),
  bookTitle: z.string().min(1, "bookTitle is required"),
  bookCoverUrl: z.string().nullable(),
  bookAuthors: z.array(z.string()),
});

export type CreateBookmarkInput = z.infer<typeof CreateBookmarkInputSchema>;

// ── RemoveBookmarkInput ───────────────────────────────────────────────────────

export const RemoveBookmarkInputSchema = z.object({
  userId: z.string().min(1),
  bookmarkId: z.string().min(1),
});

export type RemoveBookmarkInput = z.infer<typeof RemoveBookmarkInputSchema>;
