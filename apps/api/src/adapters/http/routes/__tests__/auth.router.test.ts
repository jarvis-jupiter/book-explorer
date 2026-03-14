// Integration tests for auth router — uses Supertest with stub use cases.
// Tests HTTP contract without a real database.

import { describe, expect, it, vi } from "vitest";
import request from "supertest";
import express from "express";
import "express-async-errors";
import { DuplicateEmailError, InvalidCredentialsError } from "../../../../domain/errors.js";
import { createAuthRouter } from "../auth.router.js";

// ── Helpers ───────────────────────────────────────────────────────────────────

const makeApp = (
  registerUser: (...args: unknown[]) => unknown = vi.fn().mockResolvedValue({
    token: "tok",
    user: { id: "1", email: "a@b.com" },
  }),
  loginUser: (...args: unknown[]) => unknown = vi.fn().mockResolvedValue({
    token: "tok",
    user: { id: "1", email: "a@b.com" },
  }),
) => {
  const app = express();
  app.use(express.json());
  // biome-ignore lint/suspicious/noExplicitAny: test helper cast
  app.use("/api/auth", createAuthRouter(registerUser as any, loginUser as any));
  return app;
};

// ── POST /api/auth/register ───────────────────────────────────────────────────

describe("POST /api/auth/register", () => {
  it("returns 201 with token and user on valid input (AC 1a)", async () => {
    const app = makeApp();
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "new@example.com", password: "password123" });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("token");
    expect(res.body.user).toMatchObject({ id: "1", email: "a@b.com" });
  });

  it("returns 409 when email already in use (AC 1b)", async () => {
    const registerUser = vi.fn().mockRejectedValue(new DuplicateEmailError());
    const app = makeApp(registerUser);

    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "dupe@example.com", password: "password123" });

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/email already in use/i);
  });

  it("returns 400 when password is fewer than 8 characters (AC 1c)", async () => {
    const app = makeApp();
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "new@example.com", password: "short" });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/at least 8 characters/i);
  });

  it("returns 400 when email is invalid", async () => {
    const app = makeApp();
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "not-an-email", password: "password123" });

    expect(res.status).toBe(400);
  });
});

// ── POST /api/auth/login ──────────────────────────────────────────────────────

describe("POST /api/auth/login", () => {
  it("returns 200 with token and user on correct credentials (AC 2a)", async () => {
    const app = makeApp();
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "user@example.com", password: "password123" });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
    expect(res.body.user).toMatchObject({ id: "1", email: "a@b.com" });
  });

  it("returns 401 with ambiguous error on invalid credentials (AC 2b)", async () => {
    const loginUser = vi.fn().mockRejectedValue(new InvalidCredentialsError());
    const app = makeApp(undefined, loginUser);

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "nobody@example.com", password: "wrongpass" });

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/invalid email or password/i);
  });
});

// ── POST /api/auth/logout ─────────────────────────────────────────────────────

describe("POST /api/auth/logout", () => {
  it("returns 200 with confirmation message", async () => {
    const app = makeApp();
    const res = await request(app).post("/api/auth/logout");

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/logged out/i);
  });
});
