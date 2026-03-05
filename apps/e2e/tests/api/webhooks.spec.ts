import { expect, test } from "@playwright/test";

const API_URL = process.env["API_BASE_URL"] ?? "http://localhost:3001";

/**
 * Webhook E2E tests exercise the HTTP layer directly.
 *
 * Notes on CI behaviour:
 * - CLERK_WEBHOOK_SECRET is not set in CI, so requests that reach the
 *   signature-verification step return 500 ("secret not configured").
 * - Requests that are rejected before signature verification (missing headers)
 *   always return 400 regardless of environment.
 * - Tests that send all headers but have invalid signatures assert on
 *   "non-2xx" (>= 400) to remain green in both environments.
 */

test.describe("POST /api/webhooks/clerk", () => {
  test("returns 400 when svix headers are missing", async ({ request }) => {
    const res = await request.post(`${API_URL}/api/webhooks/clerk`, {
      data: JSON.stringify({ type: "user.created", data: {} }),
      headers: { "Content-Type": "application/json" },
    });

    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body).toHaveProperty("error");
  });

  test("returns 400 when only some svix headers are present", async ({ request }) => {
    const res = await request.post(`${API_URL}/api/webhooks/clerk`, {
      data: JSON.stringify({ type: "user.created", data: {} }),
      headers: {
        "Content-Type": "application/json",
        "svix-id": "test-id",
        // missing svix-timestamp and svix-signature
      },
    });

    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body).toHaveProperty("error");
  });

  test("rejects when all svix headers present but signature is invalid", async ({ request }) => {
    const res = await request.post(`${API_URL}/api/webhooks/clerk`, {
      data: JSON.stringify({ type: "user.created", data: {} }),
      headers: {
        "Content-Type": "application/json",
        "svix-id": "msg_fake_id",
        "svix-timestamp": String(Math.floor(Date.now() / 1000)),
        "svix-signature": "v1,invalidsignaturevalue",
      },
    });

    // 400 when secret is configured (bad signature), 500 when secret is missing (CI)
    expect(res.status()).toBeGreaterThanOrEqual(400);
    const body = await res.json();
    expect(body).toHaveProperty("error");
  });

  test("error response for bad request has standard shape", async ({ request }) => {
    // Use missing-headers path — always 400 regardless of secret config
    const res = await request.post(`${API_URL}/api/webhooks/clerk`, {
      data: JSON.stringify({ type: "user.deleted", data: { id: "user_123" } }),
      headers: { "Content-Type": "application/json" },
    });

    expect(res.status()).toBe(400);
    const body = await res.json();
    // Standard error shape: { error: string, code: string }
    expect(typeof body.error).toBe("string");
    expect(typeof body.code).toBe("string");
  });

  test("rejects any request — never returns 2xx for invalid input", async ({ request }) => {
    const res = await request.post(`${API_URL}/api/webhooks/clerk`, {
      data: "not-json",
      headers: {
        "Content-Type": "application/json",
        "svix-id": "msg_test_id_002",
        "svix-timestamp": String(Math.floor(Date.now() / 1000)),
        "svix-signature": "v1,badsignature",
      },
    });

    // Should be a client or server error, never a success
    expect(res.status()).toBeGreaterThanOrEqual(400);
  });
});
