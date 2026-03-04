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
});
