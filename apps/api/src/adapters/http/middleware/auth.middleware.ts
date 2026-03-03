import { createClerkClient } from "@clerk/backend";
import type { NextFunction, Request, Response } from "express";

export type AuthenticatedRequest = Request & {
  userId: string;
};

const clerkClient = createClerkClient({
  secretKey: process.env["CLERK_SECRET_KEY"] ?? "",
});

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    res.status(401).json({ error: "Missing authorization token" });
    return;
  }

  try {
    const payload = await clerkClient.verifyToken(token, {
      jwtKey: process.env["CLERK_JWT_KEY"],
    });

    (req as AuthenticatedRequest).userId = payload.sub;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
};
