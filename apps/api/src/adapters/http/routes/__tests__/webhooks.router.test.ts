import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createWebhooksRouter } from "../webhooks.router.js";

// Mock svix
vi.mock("svix", () => ({
  Webhook: vi.fn().mockImplementation(() => ({
    verify: vi.fn(),
  })),
}));

import { Webhook } from "svix";

const makeMockUserRepo = () => ({
  upsertByClerkId: vi.fn().mockResolvedValue({ ok: true, value: { id: "cuid_abc" } }),
  findByClerkId: vi.fn().mockResolvedValue({ ok: true, value: null }),
  deleteByClerkId: vi.fn().mockResolvedValue({ ok: true, value: undefined }),
});

const makeApp = (userRepo: ReturnType<typeof makeMockUserRepo>) => {
  const app = express();
  app.use("/api/webhooks", createWebhooksRouter(userRepo));
  return app;
};

const svixHeaders = {
  "svix-id": "test-id",
  "svix-timestamp": "1234567890",
  "svix-signature": "v1,test-signature",
};

describe("webhooks.router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env["CLERK_WEBHOOK_SECRET"] = "test-secret";
  });

  it("returns 400 when svix headers are missing", async () => {
    const userRepo = makeMockUserRepo();
    const app = makeApp(userRepo);

    const res = await request(app)
      .post("/api/webhooks/clerk")
      .set("Content-Type", "application/json")
      .send(JSON.stringify({ type: "user.created", data: {} }));

    expect(res.status).toBe(400);
  });

  it("returns 400 when signature is invalid", async () => {
    const userRepo = makeMockUserRepo();
    const app = makeApp(userRepo);

    (Webhook as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => ({
      verify: vi.fn().mockImplementation(() => {
        throw new Error("Invalid signature");
      }),
    }));

    const res = await request(app)
      .post("/api/webhooks/clerk")
      .set(svixHeaders)
      .set("Content-Type", "application/json")
      .send(JSON.stringify({ type: "user.created", data: {} }));

    expect(res.status).toBe(400);
  });

  it("handles user.created event", async () => {
    const userRepo = makeMockUserRepo();
    const app = makeApp(userRepo);

    const eventData = {
      type: "user.created",
      data: {
        id: "user_123",
        email_addresses: [{ id: "ea_1", email_address: "test@example.com" }],
        primary_email_address_id: "ea_1",
        first_name: "Test",
        last_name: "User",
      },
    };

    (Webhook as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => ({
      verify: vi.fn().mockReturnValue(eventData),
    }));

    const res = await request(app)
      .post("/api/webhooks/clerk")
      .set(svixHeaders)
      .set("Content-Type", "application/json")
      .send(JSON.stringify(eventData));

    expect(res.status).toBe(200);
    expect(userRepo.upsertByClerkId).toHaveBeenCalledWith({
      clerkId: "user_123",
      email: "test@example.com",
      displayName: "Test User",
    });
  });

  it("handles user.updated event", async () => {
    const userRepo = makeMockUserRepo();
    const app = makeApp(userRepo);

    const eventData = {
      type: "user.updated",
      data: {
        id: "user_123",
        email_addresses: [{ id: "ea_1", email_address: "updated@example.com" }],
        primary_email_address_id: "ea_1",
        first_name: "Updated",
        last_name: null,
      },
    };

    (Webhook as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => ({
      verify: vi.fn().mockReturnValue(eventData),
    }));

    const res = await request(app)
      .post("/api/webhooks/clerk")
      .set(svixHeaders)
      .set("Content-Type", "application/json")
      .send(JSON.stringify(eventData));

    expect(res.status).toBe(200);
    expect(userRepo.upsertByClerkId).toHaveBeenCalledWith({
      clerkId: "user_123",
      email: "updated@example.com",
      displayName: "Updated",
    });
  });

  it("handles user.deleted event", async () => {
    const userRepo = makeMockUserRepo();
    const app = makeApp(userRepo);

    const eventData = {
      type: "user.deleted",
      data: { id: "user_123" },
    };

    (Webhook as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => ({
      verify: vi.fn().mockReturnValue(eventData),
    }));

    const res = await request(app)
      .post("/api/webhooks/clerk")
      .set(svixHeaders)
      .set("Content-Type", "application/json")
      .send(JSON.stringify(eventData));

    expect(res.status).toBe(200);
    expect(userRepo.deleteByClerkId).toHaveBeenCalledWith("user_123");
  });
});
