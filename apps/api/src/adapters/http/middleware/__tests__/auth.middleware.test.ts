// Tests for requireAuth middleware using custom JWT.

import jwt from "jsonwebtoken";
import request from "supertest";
import { describe, expect, it } from "vitest";
import express from "express";
import { requireAuth } from "../auth.middleware.js";
import type { AuthenticatedRequest } from "../auth.middleware.js";

const SECRET = "test-secret";

const makeApp = () => {
  process.env["JWT_SECRET"] = SECRET;
  const app = express();
  app.use(express.json());
  app.get("/protected", requireAuth, (req, res) => {
    res.json({ userId: (req as AuthenticatedRequest).userId });
  });
  return app;
};

const makeToken = (userId: string) => jwt.sign({ userId }, SECRET, { expiresIn: "1h" });

describe("requireAuth middleware", () => {
  it("allows requests with a valid JWT", async () => {
    const app = makeApp();
    const token = makeToken("user-123");

    const res = await request(app)
      .get("/protected")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.userId).toBe("user-123");
  });

  it("rejects requests with no Authorization header", async () => {
    const app = makeApp();
    const res = await request(app).get("/protected");
    expect(res.status).toBe(401);
  });

  it("rejects requests with an invalid token", async () => {
    const app = makeApp();
    const res = await request(app)
      .get("/protected")
      .set("Authorization", "Bearer invalid.token.here");
    expect(res.status).toBe(401);
  });

  it("rejects requests with an expired token", async () => {
    const app = makeApp();
    const expired = jwt.sign({ userId: "u1" }, SECRET, { expiresIn: 0 });

    const res = await request(app)
      .get("/protected")
      .set("Authorization", `Bearer ${expired}`);
    expect(res.status).toBe(401);
  });
});
