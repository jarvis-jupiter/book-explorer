import { expect, test } from "@playwright/test";

const API_URL = process.env["API_BASE_URL"] ?? "http://localhost:3001";

/**
 * API smoke tests — exercise the HTTP layer directly.
 * No browser required; uses Playwright's request API.
 */

test.describe("GET /health", () => {
  test("returns 200 with status ok", async ({ request }) => {
    const res = await request.get(`${API_URL}/health`);

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ status: "ok" });
  });
});
