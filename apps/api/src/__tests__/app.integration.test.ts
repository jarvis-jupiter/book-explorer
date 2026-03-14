// Integration tests for the Express app.
// Uses stub use cases / repositories — no real DB or external services.

import jwt from "jsonwebtoken";
import supertest from "supertest";
import { describe, expect, it, vi } from "vitest";
import { createApp } from "../app.js";
import type { BookmarkRepositoryPort } from "../ports/bookmark-repository.port.js";
import type { AddBookmarkUseCase } from "../use-cases/add-bookmark.use-case.js";
import type { LoginUserUseCase } from "../use-cases/login-user.use-case.js";
import type { RegisterUserUseCase } from "../use-cases/register-user.use-case.js";
import type { RemoveBookmarkUseCase } from "../use-cases/remove-bookmark.use-case.js";
import type { SearchBooksUseCase } from "../use-cases/search-books.use-case.js";

const TEST_SECRET = "test-jwt-secret";

const makeValidToken = (userId = "user-1") =>
  jwt.sign({ userId }, TEST_SECRET, { expiresIn: "1h" });

const makeApp = (overrides: Partial<{
  registerUserUseCase: RegisterUserUseCase;
  loginUserUseCase: LoginUserUseCase;
  searchBooksUseCase: SearchBooksUseCase;
  addBookmarkUseCase: AddBookmarkUseCase;
  removeBookmarkUseCase: RemoveBookmarkUseCase;
  bookmarkRepository: BookmarkRepositoryPort;
}> = {}) => {
  process.env["JWT_SECRET"] = TEST_SECRET;

  const stubUser = { id: "user-1", email: "test@example.com", passwordHash: "hash", createdAt: new Date() };

  const registerUserUseCase: RegisterUserUseCase = overrides.registerUserUseCase ??
    vi.fn().mockResolvedValue({ token: "tok", user: stubUser });

  const loginUserUseCase: LoginUserUseCase = overrides.loginUserUseCase ??
    vi.fn().mockResolvedValue({ token: "tok", user: stubUser });

  const searchBooksUseCase: SearchBooksUseCase = overrides.searchBooksUseCase ?? {
    execute: vi.fn().mockResolvedValue({ ok: true, value: { books: [], totalItems: 0, page: 1 } }),
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

  return createApp({
    registerUserUseCase,
    loginUserUseCase,
    searchBooksUseCase,
    addBookmarkUseCase,
    removeBookmarkUseCase,
    bookmarkRepository,
  });
};

// ── Health ────────────────────────────────────────────────────────────────────

describe("GET /health", () => {
  it("returns { status: ok }", async () => {
    const app = makeApp();
    const res = await supertest(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });
});

// ── Auth routes ───────────────────────────────────────────────────────────────

describe("POST /api/auth/register", () => {
  it("returns 201 on valid registration", async () => {
    const app = makeApp();
    const res = await supertest(app)
      .post("/api/auth/register")
      .send({ email: "new@example.com", password: "password123" });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("token");
  });
});

describe("POST /api/auth/login", () => {
  it("returns 200 on valid login", async () => {
    const app = makeApp();
    const res = await supertest(app)
      .post("/api/auth/login")
      .send({ email: "u@example.com", password: "password123" });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
  });
});

// ── Books search ──────────────────────────────────────────────────────────────

describe("GET /api/books/search — authenticated", () => {
  it("returns book results when authenticated", async () => {
    const books = [
      { id: "abc123", title: "Harry Potter", authors: ["J.K. Rowling"], publisher: "Bloomsbury", description: "A wizard story", coverUrl: null },
    ];
    const searchBooksUseCase: SearchBooksUseCase = {
      execute: vi.fn().mockResolvedValue({ ok: true, value: { books, totalItems: 1, page: 1 } }),
    };
    const app = makeApp({ searchBooksUseCase });
    const token = makeValidToken();

    const res = await supertest(app)
      .get("/api/books/search?q=harry+potter")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.books).toHaveLength(1);
  });

  it("returns 401 when unauthenticated", async () => {
    const app = makeApp();
    const res = await supertest(app).get("/api/books/search?q=test");
    expect(res.status).toBe(401);
  });
});

// ── Bookmarks ─────────────────────────────────────────────────────────────────

describe("GET /api/bookmarks", () => {
  it("returns 401 without an authorization header", async () => {
    const app = makeApp();
    const res = await supertest(app).get("/api/bookmarks");
    expect(res.status).toBe(401);
  });

  it("returns 200 with bookmark list when authenticated", async () => {
    const app = makeApp();
    const token = makeValidToken();

    const res = await supertest(app)
      .get("/api/bookmarks")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
