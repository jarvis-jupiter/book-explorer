import type { BookSearchResult, SearchBooksQuery } from "@book-explorer/domain";
import { z } from "zod";
import { externalServiceError } from "../domain/errors.js";
import { err, ok } from "../domain/result.js";
import type { BookRepositoryPort } from "../ports/book-repository.port.js";

const GOOGLE_BOOKS_BASE_URL = "https://www.googleapis.com/books/v1/volumes";

// ── Zod schema for external API response ──────────────────────────────────────

const GoogleBooksVolumeInfoSchema = z.object({
  title: z.string().optional(),
  authors: z.array(z.string()).optional(),
  publisher: z.string().optional(),
  description: z.string().optional(),
  imageLinks: z
    .object({
      thumbnail: z.string().optional(),
      smallThumbnail: z.string().optional(),
    })
    .optional(),
  publishedDate: z.string().optional(),
  pageCount: z.number().optional(),
  categories: z.array(z.string()).optional(),
  averageRating: z.number().optional(),
});

const GoogleBooksItemSchema = z.object({
  id: z.string(),
  volumeInfo: GoogleBooksVolumeInfoSchema,
});

export const GoogleBooksResponseSchema = z.object({
  totalItems: z.number(),
  items: z.array(GoogleBooksItemSchema).optional(),
});

type GoogleBooksItem = z.infer<typeof GoogleBooksItemSchema>;

// ── Mapping ───────────────────────────────────────────────────────────────────

const toBook = (item: GoogleBooksItem) => ({
  id: item.id,
  title: item.volumeInfo.title ?? "Unknown Title",
  authors: item.volumeInfo.authors ?? [],
  publisher: item.volumeInfo.publisher ?? null,
  description: item.volumeInfo.description ?? null,
  coverUrl: item.volumeInfo.imageLinks?.thumbnail?.replace("http://", "https://") ?? null,
  publishedDate: item.volumeInfo.publishedDate ?? null,
  pageCount: item.volumeInfo.pageCount ?? null,
  categories: item.volumeInfo.categories ?? [],
  averageRating: item.volumeInfo.averageRating ?? null,
});

// ── Adapter ───────────────────────────────────────────────────────────────────

export const createGoogleBooksAdapter = (): BookRepositoryPort => ({
  search: async (query: SearchBooksQuery) => {
    const apiKey = process.env["GOOGLE_BOOKS_API_KEY"];
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const startIndex = (page - 1) * pageSize;

    const params = new URLSearchParams({
      q: query.query,
      startIndex: String(startIndex),
      maxResults: String(pageSize),
      ...(apiKey ? { key: apiKey } : {}),
    });

    try {
      const response = await fetch(`${GOOGLE_BOOKS_BASE_URL}?${params.toString()}`);

      if (!response.ok) {
        return err(
          externalServiceError(`Google Books API error: ${response.status} ${response.statusText}`),
        );
      }

      const raw = await response.json();
      const parsed = GoogleBooksResponseSchema.safeParse(raw);

      if (!parsed.success) {
        return err(
          externalServiceError(`Unexpected Google Books response shape: ${parsed.error.message}`),
        );
      }

      const data = parsed.data;
      const result: BookSearchResult = {
        books: (data.items ?? []).map(toBook),
        totalItems: data.totalItems,
        page,
        pageSize,
      };

      return ok(result);
    } catch (error) {
      return err(
        externalServiceError(
          `Failed to reach Google Books API: ${error instanceof Error ? error.message : String(error)}`,
        ),
      );
    }
  },
});
