import { expect, test } from "@playwright/test";

const API_URL = process.env["API_BASE_URL"] ?? "http://localhost:3001";

/**
 * Webhook E2E tests exercise the HTTP layer directly.
 * We can't easily produce valid svix signatures without the secret,
 * so we focus on the rejection path (bad/missing signatures → 400)
 * and the missing-config path. Valid-signature tests require the
 * CLERK_WEBHOOK_SECRET env var to be set in the test environment.
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

  test("returns 400 when all svix headers present but signature is invalid", async ({
    request,
  }) => {
    const res = await request.post(`${API_URL}/api/webhooks/clerk`, {
      data: JSON.stringify({ type: "user.created", data: {} }),
      headers: {
        "Content-Type": "application/json",
        "svix-id": "msg_fake_id",
        "svix-timestamp": String(Math.floor(Date.now() / 1000)),
        "svix-signature": "v1,invalidsignaturevalue",
      },
    });

    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body).toHaveProperty("error");
    expect(body).toHaveProperty("code");
  });

  test("response for invalid signature has correct error shape", async ({ request }) => {
    const res = await request.post(`${API_URL}/api/webhooks/clerk`, {
      data: JSON.stringify({ type: "user.deleted", data: { id: "user_123" } }),
      headers: {
        "Content-Type": "application/json",
        "svix-id": "msg_test_id_001",
        "svix-timestamp": String(Math.floor(Date.now() / 1000)),
        "svix-signature": "v1,badsignature",
      },
    });

    expect(res.status()).toBe(400);
    const body = await res.json();
    // Should follow the standard error shape: { error, code }
    expect(typeof body.error).toBe("string");
    expect(typeof body.code).toBe("string");
  });

  test("returns 400 (not 5xx) for any malformed request", async ({ request }) => {
    const res = await request.post(`${API_URL}/api/webhooks/clerk`, {
      data: "not-json",
      headers: {
        "Content-Type": "application/json",
        "svix-id": "msg_test_id_002",
        "svix-timestamp": String(Math.floor(Date.now() / 1000)),
        "svix-signature": "v1,badsignature",
      },
    });

    // Should be a client error (4xx), not a server crash (5xx)
    expect(res.status()).toBeGreaterThanOrEqual(400);
    expect(res.status()).toBeLessThan(500);
  });
});
