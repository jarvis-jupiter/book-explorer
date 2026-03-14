// Auth middleware — validates Bearer JWT issued by this backend.
// Replaces Clerk-based verification with custom jsonwebtoken verification.
// Attaches the resolved DB userId to req for downstream handlers.

import type { NextFunction, Request, Response } from "express";
import { decodeToken } from "../../../domain/services/tokenService.js";

export type AuthenticatedRequest = Request & {
  userId: string;
};

/**
 * Express middleware: verifies the Authorization: Bearer <jwt> header.
 * On success, sets req.userId (DB CUID) and calls next().
 * On failure, responds 401 immediately.
 */
export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : undefined;

  if (!token) {
    res.status(401).json({ error: "Missing authorization token", code: "UNAUTHORIZED" });
    return;
  }

  try {
    const payload = decodeToken(token);
    (req as AuthenticatedRequest).userId = payload.userId;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token", code: "UNAUTHORIZED" });
  }
};
