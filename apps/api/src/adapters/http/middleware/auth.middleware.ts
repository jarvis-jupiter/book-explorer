import { verifyToken } from "@clerk/backend";
import type { NextFunction, Request, Response } from "express";
import type { UserRepositoryPort } from "../../../ports/user-repository.port.js";

export type AuthenticatedRequest = Request & {
  userId: string;
};

export const createRequireAuth =
  (userRepository: UserRepositoryPort) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      res.status(401).json({ error: "Missing authorization token", code: "UNAUTHORIZED" });
      return;
    }

    try {
      const jwtKey = process.env["CLERK_JWT_KEY"];
      const verifyOptions = {
        secretKey: process.env["CLERK_SECRET_KEY"] ?? "",
        ...(jwtKey !== undefined ? { jwtKey } : {}),
      };

      const payload = await verifyToken(token, verifyOptions);
      const clerkId = payload.sub;

      // Upsert the user in DB to get the DB CUID (fixes FK violation bug)
      const email =
        typeof (payload as Record<string, unknown>)["email"] === "string"
          ? ((payload as Record<string, unknown>)["email"] as string)
          : clerkId;

      const result = await userRepository.upsertByClerkId({
        clerkId,
        email,
        displayName: null,
      });

      if (!result.ok) {
        res.status(500).json({ error: "Failed to resolve user", code: "INTERNAL_ERROR" });
        return;
      }

      (req as AuthenticatedRequest).userId = result.value.id;
      next();
    } catch {
      res.status(401).json({ error: "Invalid or expired token", code: "UNAUTHORIZED" });
    }
  };

// Legacy export for backward compatibility in tests
export const requireAuth = createRequireAuth({
  upsertByClerkId: async () => ({
    ok: false as const,
    error: { kind: "InternalError" as const, message: "No user repository" },
  }),
  findByClerkId: async () => ({
    ok: false as const,
    error: { kind: "InternalError" as const, message: "No user repository" },
  }),
  deleteByClerkId: async () => ({
    ok: false as const,
    error: { kind: "InternalError" as const, message: "No user repository" },
  }),
});
