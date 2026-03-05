import type { NextFunction, Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createRequireAuth } from "../auth.middleware.js";

vi.mock("@clerk/backend", () => ({
  verifyToken: vi.fn(),
}));

import { verifyToken } from "@clerk/backend";

const makeMockUserRepo = () => ({
  upsertByClerkId: vi.fn().mockResolvedValue({
    ok: true,
    value: {
      id: "cuid_db_id",
      clerkId: "user_clerk123",
      email: "t@t.com",
      displayName: null,
      createdAt: new Date(),
    },
  }),
  findByClerkId: vi.fn(),
  deleteByClerkId: vi.fn(),
});

const makeReqResMock = (token?: string) => {
  const req = {
    headers: { authorization: token ? `Bearer ${token}` : undefined },
  } as unknown as Request;
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
  const next = vi.fn() as NextFunction;
  return { req, res, next };
};

describe("createRequireAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when no token is provided", async () => {
    const userRepo = makeMockUserRepo();
    const middleware = createRequireAuth(userRepo);
    const { req, res, next } = makeReqResMock();

    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("attaches DB userId (CUID) to req after JWT verification", async () => {
    const userRepo = makeMockUserRepo();
    const middleware = createRequireAuth(userRepo);
    const { req, res, next } = makeReqResMock("valid_token");

    (verifyToken as ReturnType<typeof vi.fn>).mockResolvedValue({
      sub: "user_clerk123",
      email: "t@t.com",
    });

    await middleware(req, res, next);

    // The DB userId (CUID) should be attached, NOT the Clerk ID
    expect((req as Request & { userId: string }).userId).toBe("cuid_db_id");
    expect(next).toHaveBeenCalled();
  });

  it("calls upsertByClerkId with the Clerk ID from JWT", async () => {
    const userRepo = makeMockUserRepo();
    const middleware = createRequireAuth(userRepo);
    const { req, res, next } = makeReqResMock("valid_token");

    (verifyToken as ReturnType<typeof vi.fn>).mockResolvedValue({
      sub: "user_clerk123",
      email: "t@t.com",
    });

    await middleware(req, res, next);

    expect(userRepo.upsertByClerkId).toHaveBeenCalledWith(
      expect.objectContaining({ clerkId: "user_clerk123" }),
    );
  });

  it("returns 401 when token verification fails", async () => {
    const userRepo = makeMockUserRepo();
    const middleware = createRequireAuth(userRepo);
    const { req, res, next } = makeReqResMock("invalid_token");

    (verifyToken as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("invalid"));

    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 500 when user upsert fails", async () => {
    const userRepo = {
      ...makeMockUserRepo(),
      upsertByClerkId: vi
        .fn()
        .mockResolvedValue({ ok: false, error: { kind: "InternalError", message: "DB down" } }),
    };
    const middleware = createRequireAuth(userRepo);
    const { req, res, next } = makeReqResMock("valid_token");

    (verifyToken as ReturnType<typeof vi.fn>).mockResolvedValue({
      sub: "user_clerk123",
    });

    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(next).not.toHaveBeenCalled();
  });
});
