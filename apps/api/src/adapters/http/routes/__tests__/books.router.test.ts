import express from "express";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ok } from "../../../../domain/result.js";
import type { SearchBooksUseCase } from "../../../../use-cases/search-books.use-case.js";
import { createBooksRouter } from "../books.router.js";

const makeSearchUseCase = (): SearchBooksUseCase => ({
  execute: vi.fn().mockResolvedValue(ok({ books: [], totalItems: 0, page: 1, pageSize: 10 })),
});

const makeApp = () => {
  const app = express();
  app.use(express.json());
  app.use("/api/books", createBooksRouter(makeSearchUseCase()));
  return app;
};

describe("GET /api/books/:id", () => {
  const mockBook = {
    id: "test-book-id",
    volumeInfo: {
      title: "Clean Code",
      authors: ["Robert C. Martin"],
      publisher: "Prentice Hall",
      description: "A handbook of agile software craftsmanship.",
      imageLinks: { thumbnail: "http://books.google.com/cover.jpg" },
      publishedDate: "2008-08-01",
      pageCount: 431,
      categories: ["Computers"],
      averageRating: 4.5,
    },
  };

  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockBook,
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns 200 with mapped book shape", async () => {
    const app = makeApp();
    const res = await request(app).get("/api/books/test-book-id");

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id: "test-book-id",
      title: "Clean Code",
      authors: ["Robert C. Martin"],
      publisher: "Prentice Hall",
      description: "A handbook of agile software craftsmanship.",
      coverUrl: "https://books.google.com/cover.jpg",
      publishedDate: "2008-08-01",
      pageCount: 431,
      categories: ["Computers"],
      averageRating: 4.5,
    });
  });

  it("upgrades http cover URL to https", async () => {
    const app = makeApp();
    const res = await request(app).get("/api/books/test-book-id");
    expect(res.status).toBe(200);
    expect(res.body.coverUrl).toBe("https://books.google.com/cover.jpg");
  });

  it("returns 404 when Google Books API returns non-ok", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      }),
    );
    const app = makeApp();
    const res = await request(app).get("/api/books/nonexistent-id");
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error");
  });
});
