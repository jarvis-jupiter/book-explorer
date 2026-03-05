import supertest from "supertest";
import { describe, expect, it, vi } from "vitest";
import { createApp } from "../app.js";
import type { BookmarkRepositoryPort } from "../ports/bookmark-repository.port.js";
import type { AddBookmarkUseCase } from "../use-cases/add-bookmark.use-case.js";
import type { RemoveBookmarkUseCase } from "../use-cases/remove-bookmark.use-case.js";
import type { SearchBooksUseCase } from "../use-cases/search-books.use-case.js";

const makeApp = (
  overrides: Partial<{
    searchBooksUseCase: SearchBooksUseCase;
    addBookmarkUseCase: AddBookmarkUseCase;
    removeBookmarkUseCase: RemoveBookmarkUseCase;
    bookmarkRepository: BookmarkRepositoryPort;
  }> = {},
) => {
  const searchBooksUseCase: SearchBooksUseCase = overrides.searchBooksUseCase ?? {
    execute: vi.fn().mockResolvedValue({
      ok: true,
      value: { books: [], totalItems: 0, page: 1 },
    }),
  };

  const addBookmarkUseCase: AddBookmarkUseCase = overrides.addBookmarkUseCase ?? {
    execute: vi.fn().mockResolvedValue({ ok: true, value: {} }),
  };

  const removeBookmarkUseCase: RemoveBookmarkUseCase = overrides.removeBookmarkUseCase ?? {
    execute: vi.fn().mockResolvedValue({ ok: true, value: undefined }),
  };

  const bookmarkRepository: BookmarkRepositoryPort = overrides.bookmarkRepository ?? {
    findByUserId: vi.fn().mockResolvedValue({ ok: true, value: [] }),
    findById: vi.fn().mockResolvedValue({ ok: true, value: null }),
    findByUserAndBook: vi.fn().mockResolvedValue({ ok: true, value: null }),
    create: vi.fn().mockResolvedValue({ ok: true, value: {} }),
    deleteById: vi.fn().mockResolvedValue({ ok: true, value: undefined }),
  };

  const userRepository = {
    upsertByClerkId: vi.fn().mockResolvedValue({
      ok: true,
      value: {
        id: "cuid_test",
        clerkId: "user_test",
        email: "t@t.com",
        displayName: null,
        createdAt: new Date(),
      },
    }),
    findByClerkId: vi.fn().mockResolvedValue({ ok: true, value: null }),
    deleteByClerkId: vi.fn().mockResolvedValue({ ok: true, value: undefined }),
  };

  return createApp({
    searchBooksUseCase,
    addBookmarkUseCase,
    removeBookmarkUseCase,
    bookmarkRepository,
    userRepository,
  });
};

describe("GET /health", () => {
  it("returns { status: ok }", async () => {
    const app = makeApp();
    const res = await supertest(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });
});

describe("GET /api/books/search", () => {
  it("returns book results from the search use case", async () => {
    const books = [
      {
        id: "abc123",
        title: "Harry Potter",
        authors: ["J.K. Rowling"],
        publisher: "Bloomsbury",
        description: "A wizard story",
        coverUrl: null,
      },
    ];

    const searchBooksUseCase: SearchBooksUseCase = {
      execute: vi.fn().mockResolvedValue({
        ok: true,
        value: { books, totalItems: 1, page: 1 },
      }),
    };

    const app = makeApp({ searchBooksUseCase });
    const res = await supertest(app).get("/api/books/search?q=harry+potter");

    expect(res.status).toBe(200);
    expect(res.body.books).toHaveLength(1);
    expect(res.body.books[0].title).toBe("Harry Potter");
  });
});

describe("GET /api/books/search — validation", () => {
  it("returns 400 when q param is missing", async () => {
    const app = makeApp();
    const res = await supertest(app).get("/api/books/search");
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
    expect(res.body).toHaveProperty("details");
  });

  it("returns 400 when page is not a positive integer", async () => {
    const app = makeApp();
    const res = await supertest(app).get("/api/books/search?q=test&page=abc");
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("details");
  });
});

describe("GET /api/bookmarks", () => {
  it("returns 401 without an authorization header", async () => {
    const app = makeApp();
    const res = await supertest(app).get("/api/bookmarks");
    expect(res.status).toBe(401);
  });
});
