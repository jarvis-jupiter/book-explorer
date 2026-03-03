import type { Book, BookSearchResult, SearchBooksQuery } from "@book-explorer/domain";
import type { BookRepositoryPort } from "../ports/book-repository.port.js";
import { err, ok } from "../domain/result.js";
import { externalServiceError } from "../domain/errors.js";

const GOOGLE_BOOKS_BASE_URL = "https://www.googleapis.com/books/v1/volumes";

type GoogleBooksVolumeInfo = {
  title?: string;
  authors?: string[];
  publisher?: string;
  description?: string;
  imageLinks?: { thumbnail?: string; smallThumbnail?: string };
  publishedDate?: string;
  pageCount?: number;
  categories?: string[];
  averageRating?: number;
};

type GoogleBooksItem = {
  id: string;
  volumeInfo: GoogleBooksVolumeInfo;
};

type GoogleBooksResponse = {
  totalItems: number;
  items?: GoogleBooksItem[];
};

const toBook = (item: GoogleBooksItem): Book => ({
  id: item.id,
  title: item.volumeInfo.title ?? "Unknown Title",
  authors: item.volumeInfo.authors ?? [],
  publisher: item.volumeInfo.publisher ?? null,
  description: item.volumeInfo.description ?? null,
  coverUrl:
    item.volumeInfo.imageLinks?.thumbnail?.replace("http://", "https://") ?? null,
  publishedDate: item.volumeInfo.publishedDate ?? null,
  pageCount: item.volumeInfo.pageCount ?? null,
  categories: item.volumeInfo.categories ?? [],
  averageRating: item.volumeInfo.averageRating ?? null,
});

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

      const data = (await response.json()) as GoogleBooksResponse;

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
