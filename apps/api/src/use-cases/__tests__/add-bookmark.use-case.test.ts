import { describe, expect, it, vi } from "vitest";
import type { BookmarkRepositoryPort } from "../../ports/bookmark-repository.port.js";
import type { Bookmark } from "@book-explorer/domain";
import { createAddBookmarkUseCase } from "../add-bookmark.use-case.js";
import { ok, err } from "../../domain/result.js";
import { conflict } from "../../domain/errors.js";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const makeBookmark = (overrides: Partial<Bookmark> = {}): Bookmark => ({
  id: "bookmark-1",
  userId: "user-1",
  bookId: "book-1",
  bookTitle: "TypeScript Deep Dive",
  bookCoverUrl: "https://example.com/cover.jpg",
  bookAuthors: ["Basarat Ali Syed"],
  createdAt: new Date("2024-01-01"),
  ...overrides,
});

const makeBookmarkRepository = (
  overrides: Partial<BookmarkRepositoryPort> = {},
): BookmarkRepositoryPort => ({
  findById: vi.fn().mockResolvedValue(ok(makeBookmark())),
  findByUserId: vi.fn().mockResolvedValue(ok([])),
  findByUserAndBook: vi.fn().mockResolvedValue(ok(null)),
  create: vi.fn().mockResolvedValue(ok(makeBookmark())),
  deleteById: vi.fn().mockResolvedValue(ok(undefined)),
  ...overrides,
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("addBookmark use case", () => {
  describe("validation", () => {
    it("should return ValidationError when bookId is empty", async () => {
      const repository = makeBookmarkRepository();
      const useCase = createAddBookmarkUseCase(repository);

      const result = await useCase.execute({
        userId: "user-1",
        bookId: "",
        bookTitle: "Some Book",
        bookCoverUrl: null,
        bookAuthors: [],
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.kind).toBe("ValidationError");
        expect(result.error.message).toMatch(/book id/i);
      }
    });

    it("should return ValidationError when userId is empty", async () => {
      const repository = makeBookmarkRepository();
      const useCase = createAddBookmarkUseCase(repository);

      const result = await useCase.execute({
        userId: "",
        bookId: "book-1",
        bookTitle: "Some Book",
        bookCoverUrl: null,
        bookAuthors: [],
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.kind).toBe("ValidationError");
        expect(result.error.message).toMatch(/user id/i);
      }
    });

    it("should return ValidationError when bookTitle is empty", async () => {
      const repository = makeBookmarkRepository();
      const useCase = createAddBookmarkUseCase(repository);

      const result = await useCase.execute({
        userId: "user-1",
        bookId: "book-1",
        bookTitle: "",
        bookCoverUrl: null,
        bookAuthors: [],
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.kind).toBe("ValidationError");
        expect(result.error.message).toMatch(/book title/i);
      }
    });
  });

  describe("duplicate detection", () => {
    it("should return Conflict when bookmark already exists", async () => {
      const existingBookmark = makeBookmark();
      const repository = makeBookmarkRepository({
        findByUserAndBook: vi.fn().mockResolvedValue(ok(existingBookmark)),
      });
      const useCase = createAddBookmarkUseCase(repository);

      const result = await useCase.execute({
        userId: "user-1",
        bookId: "book-1",
        bookTitle: "TypeScript Deep Dive",
        bookCoverUrl: null,
        bookAuthors: [],
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.kind).toBe("Conflict");
        expect(result.error.message).toMatch(/already bookmarked/i);
      }
      expect(repository.create).not.toHaveBeenCalled();
    });
  });

  describe("happy path", () => {
    it("should create and return a bookmark when input is valid", async () => {
      const bookmark = makeBookmark();
      const repository = makeBookmarkRepository({
        create: vi.fn().mockResolvedValue(ok(bookmark)),
      });
      const useCase = createAddBookmarkUseCase(repository);

      const result = await useCase.execute({
        userId: "user-1",
        bookId: "book-1",
        bookTitle: "TypeScript Deep Dive",
        bookCoverUrl: "https://example.com/cover.jpg",
        bookAuthors: ["Basarat Ali Syed"],
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.bookId).toBe("book-1");
        expect(result.value.userId).toBe("user-1");
        expect(result.value.bookTitle).toBe("TypeScript Deep Dive");
      }
    });

    it("should call create with the provided input", async () => {
      const repository = makeBookmarkRepository();
      const useCase = createAddBookmarkUseCase(repository);

      const input = {
        userId: "user-1",
        bookId: "book-1",
        bookTitle: "TypeScript Deep Dive",
        bookCoverUrl: "https://example.com/cover.jpg",
        bookAuthors: ["Basarat Ali Syed"],
      };

      await useCase.execute(input);

      expect(repository.create).toHaveBeenCalledWith(input);
    });
  });

  describe("error propagation", () => {
    it("should propagate Conflict error from repository", async () => {
      const repository = makeBookmarkRepository({
        create: vi.fn().mockResolvedValue(err(conflict("Bookmark already exists for this book"))),
      });
      const useCase = createAddBookmarkUseCase(repository);

      const result = await useCase.execute({
        userId: "user-1",
        bookId: "book-1",
        bookTitle: "Some Book",
        bookCoverUrl: null,
        bookAuthors: [],
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.kind).toBe("Conflict");
      }
    });
  });
});
