// Token service — pure wrappers around jsonwebtoken.
// Isolated here so use cases never import jsonwebtoken directly.

import jwt from "jsonwebtoken";

const TOKEN_TTL = "7d";

export type TokenPayload = {
  readonly userId: string;
};

/** Issue a signed JWT containing the user's DB id. */
export const issueToken = (userId: string): string => {
  const secret = process.env["JWT_SECRET"];
  if (!secret) throw new Error("JWT_SECRET is not set");
  return jwt.sign({ userId }, secret, { expiresIn: TOKEN_TTL });
};

/** Verify and decode a JWT. Returns the payload or throws. */
export const decodeToken = (token: string): TokenPayload => {
  const secret = process.env["JWT_SECRET"];
  if (!secret) throw new Error("JWT_SECRET is not set");
  return jwt.verify(token, secret) as TokenPayload;
};
