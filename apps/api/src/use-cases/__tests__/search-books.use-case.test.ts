import { describe, expect, it, vi } from "vitest";
import type { BookRepositoryPort } from "../../ports/book-repository.port.js";
import type { BookSearchResult } from "@book-explorer/domain";
import { createSearchBooksUseCase } from "../search-books.use-case.js";
import { ok, err } from "../../domain/result.js";
import { externalServiceError } from "../../domain/errors.js";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const makeBook = (overrides: Partial<BookSearchResult["books"][number]> = {}) => ({
  id: "book-1",
  title: "TypeScript Deep Dive",
  authors: ["Basarat Ali Syed"],
  publisher: "GitBook",
  description: "A deep dive into TypeScript",
  coverUrl: "https://example.com/cover.jpg",
  publishedDate: "2018-01-01",
  pageCount: 300,
  categories: ["Programming"],
  averageRating: 4.5,
  ...overrides,
});

const makeSearchResult = (overrides: Partial<BookSearchResult> = {}): BookSearchResult => ({
  books: [makeBook()],
  totalItems: 1,
  page: 1,
  pageSize: 10,
  ...overrides,
});

const makeBookRepository = (
  overrides: Partial<BookRepositoryPort> = {},
): BookRepositoryPort => ({
  search: vi.fn().mockResolvedValue(ok(makeSearchResult())),
  ...overrides,
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("searchBooks use case", () => {
  describe("validation", () => {
    it("should return a ValidationError when query is empty", async () => {
      const repository = makeBookRepository();
      const useCase = createSearchBooksUseCase(repository);

      const result = await useCase.execute({ query: "" });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.kind).toBe("ValidationError");
        expect(result.error.message).toMatch(/empty/i);
      }
      expect(repository.search).not.toHaveBeenCalled();
    });

    it("should return a ValidationError when query is only whitespace", async () => {
      const repository = makeBookRepository();
      const useCase = createSearchBooksUseCase(repository);

      const result = await useCase.execute({ query: "   " });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.kind).toBe("ValidationError");
      }
    });
  });

  describe("happy path", () => {
    it("should return books when query is valid", async () => {
      const searchResult = makeSearchResult();
      const repository = makeBookRepository({
        search: vi.fn().mockResolvedValue(ok(searchResult)),
      });
      const useCase = createSearchBooksUseCase(repository);

      const result = await useCase.execute({ query: "TypeScript" });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.books).toHaveLength(1);
        expect(result.value.books[0]?.title).toBe("TypeScript Deep Dive");
      }
    });

    it("should trim the query before calling the repository", async () => {
      const repository = makeBookRepository();
      const useCase = createSearchBooksUseCase(repository);

      await useCase.execute({ query: "  TypeScript  " });

      expect(repository.search).toHaveBeenCalledWith(
        expect.objectContaining({ query: "TypeScript" }),
      );
    });

    it("should use default page=1 and pageSize=10 when not provided", async () => {
      const repository = makeBookRepository();
      const useCase = createSearchBooksUseCase(repository);

      await useCase.execute({ query: "TypeScript" });

      expect(repository.search).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, pageSize: 10 }),
      );
    });

    it("should cap pageSize at 40", async () => {
      const repository = makeBookRepository();
      const useCase = createSearchBooksUseCase(repository);

      await useCase.execute({ query: "TypeScript", pageSize: 100 });

      expect(repository.search).toHaveBeenCalledWith(
        expect.objectContaining({ pageSize: 40 }),
      );
    });
  });

  describe("error propagation", () => {
    it("should propagate ExternalServiceError from the repository", async () => {
      const repository = makeBookRepository({
        search: vi.fn().mockResolvedValue(err(externalServiceError("API down"))),
      });
      const useCase = createSearchBooksUseCase(repository);

      const result = await useCase.execute({ query: "TypeScript" });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.kind).toBe("ExternalServiceError");
        expect(result.error.message).toBe("API down");
      }
    });
  });
});
