// Token service — application layer.
// Pure wrapper around jsonwebtoken with secret injected as a parameter.
// The domain layer has zero knowledge of JWT or environment variables.
// The secret must be provided by the caller (composition root or adapter).

import jwt from "jsonwebtoken";

const TOKEN_TTL = "7d";

export type TokenPayload = {
  readonly userId: string;
};

/**
 * Issue a signed JWT containing the user's DB id.
 * `secret` is injected by the caller — never read from process.env here.
 */
export const issueToken = (userId: string, secret: string): string =>
  jwt.sign({ userId }, secret, { expiresIn: TOKEN_TTL });

/**
 * Verify and decode a JWT. Returns the payload or throws.
 * `secret` is injected by the caller — never read from process.env here.
 */
export const decodeToken = (token: string, secret: string): TokenPayload =>
  jwt.verify(token, secret) as TokenPayload;
