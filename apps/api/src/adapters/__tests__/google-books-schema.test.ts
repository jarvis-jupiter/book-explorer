import { describe, expect, it } from "vitest";
import { GoogleBooksResponseSchema } from "../google-books.adapter.js";

describe("GoogleBooksResponseSchema", () => {
  it("parses a valid google books response", () => {
    const raw = {
      totalItems: 2,
      items: [
        {
          id: "abc123",
          volumeInfo: {
            title: "Clean Code",
            authors: ["Robert C. Martin"],
            publisher: "Prentice Hall",
          },
        },
      ],
    };
    const result = GoogleBooksResponseSchema.safeParse(raw);
    expect(result.success).toBe(true);
  });

  it("parses a response with no items", () => {
    const raw = { totalItems: 0 };
    const result = GoogleBooksResponseSchema.safeParse(raw);
    expect(result.success).toBe(true);
  });

  it("fails when totalItems is missing", () => {
    const raw = { items: [] };
    const result = GoogleBooksResponseSchema.safeParse(raw);
    expect(result.success).toBe(false);
  });

  it("fails when totalItems is not a number", () => {
    const raw = { totalItems: "many" };
    const result = GoogleBooksResponseSchema.safeParse(raw);
    expect(result.success).toBe(false);
  });
});
