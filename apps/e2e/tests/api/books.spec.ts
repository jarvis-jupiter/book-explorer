import { expect, test } from "@playwright/test";

const API_URL = process.env["API_BASE_URL"] ?? "http://localhost:3001";

test.describe("GET /api/books/search", () => {
  test("returns 200 with a books array for a valid query", async ({ request }) => {
    const res = await request.get(`${API_URL}/api/books/search`, {
      params: { q: "javascript" },
    });

    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body).toHaveProperty("books");
    expect(Array.isArray(body.books)).toBe(true);
    expect(body).toHaveProperty("totalItems");
    expect(typeof body.totalItems).toBe("number");
    expect(body).toHaveProperty("page");
  });

  test("returns paginated results with page param", async ({ request }) => {
    const res = await request.get(`${API_URL}/api/books/search`, {
      params: { q: "python", page: "2", pageSize: "5" },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.page).toBe(2);
    expect(body.books.length).toBeLessThanOrEqual(5);
  });

  test("returns 400 when query param is missing", async ({ request }) => {
    const res = await request.get(`${API_URL}/api/books/search`);

    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body).toHaveProperty("error");
  });

  test("returns 400 when query is an empty string", async ({ request }) => {
    const res = await request.get(`${API_URL}/api/books/search`, {
      params: { q: "" },
    });

    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body).toHaveProperty("error");
  });

  test("each book in results has required shape", async ({ request }) => {
    const res = await request.get(`${API_URL}/api/books/search`, {
      params: { q: "clean code" },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();

    for (const book of body.books) {
      expect(book).toHaveProperty("id");
      expect(typeof book.id).toBe("string");
      expect(book).toHaveProperty("title");
      expect(typeof book.title).toBe("string");
      expect(book).toHaveProperty("authors");
      expect(Array.isArray(book.authors)).toBe(true);
    }
  });

  // ── Filter query params ────────────────────────────────────────────────────

  test("accepts sort=relevance and returns 200", async ({ request }) => {
    const res = await request.get(`${API_URL}/api/books/search`, {
      params: { q: "javascript", sort: "relevance" },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.books)).toBe(true);
  });

  test("accepts sort=newest and returns 200", async ({ request }) => {
    const res = await request.get(`${API_URL}/api/books/search`, {
      params: { q: "javascript", sort: "newest" },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.books)).toBe(true);
  });

  test("rejects invalid sort value with 400", async ({ request }) => {
    const res = await request.get(`${API_URL}/api/books/search`, {
      params: { q: "javascript", sort: "random" },
    });

    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body).toHaveProperty("error");
  });

  test("accepts lang=en and returns 200", async ({ request }) => {
    const res = await request.get(`${API_URL}/api/books/search`, {
      params: { q: "javascript", lang: "en" },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.books)).toBe(true);
  });

  test("accepts filter=ebooks and returns 200", async ({ request }) => {
    const res = await request.get(`${API_URL}/api/books/search`, {
      params: { q: "javascript", filter: "ebooks" },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.books)).toBe(true);
  });

  test("accepts filter=free-ebooks and returns 200", async ({ request }) => {
    const res = await request.get(`${API_URL}/api/books/search`, {
      params: { q: "javascript", filter: "free-ebooks" },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.books)).toBe(true);
  });

  test("rejects invalid filter value with 400", async ({ request }) => {
    const res = await request.get(`${API_URL}/api/books/search`, {
      params: { q: "javascript", filter: "audiobooks" },
    });

    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body).toHaveProperty("error");
  });

  test("accepts all filter params together and returns 200", async ({ request }) => {
    const res = await request.get(`${API_URL}/api/books/search`, {
      params: { q: "python", sort: "newest", lang: "en", filter: "ebooks" },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.books)).toBe(true);
    expect(body).toHaveProperty("page");
    expect(body).toHaveProperty("totalItems");
  });

  // ── Error response shape ───────────────────────────────────────────────────

  test("error responses include error and code fields", async ({ request }) => {
    const res = await request.get(`${API_URL}/api/books/search`);

    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body).toHaveProperty("error");
    expect(body).toHaveProperty("code");
  });
});

test.describe("GET /api/books/:id", () => {
  test("returns 200 with book shape for a valid id", async ({ request }) => {
    const searchRes = await request.get(`${API_URL}/api/books/search`, {
      params: { q: "clean code" },
    });
    expect(searchRes.status()).toBe(200);
    const searchBody = await searchRes.json();
    const firstBook = searchBody.books[0];
    if (!firstBook) return;

    const res = await request.get(`${API_URL}/api/books/${firstBook.id}`);
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body).toHaveProperty("id", firstBook.id);
    expect(body).toHaveProperty("title");
    expect(typeof body.title).toBe("string");
    expect(body).toHaveProperty("authors");
    expect(Array.isArray(body.authors)).toBe(true);
  });

  test("returns 404 with error and code for unknown id", async ({ request }) => {
    const res = await request.get(`${API_URL}/api/books/TOTALLY_INVALID_BOOK_ID_XYZ`);

    expect(res.status()).toBe(404);
    const body = await res.json();
    expect(body).toHaveProperty("error");
    expect(body).toHaveProperty("code");
  });
});
