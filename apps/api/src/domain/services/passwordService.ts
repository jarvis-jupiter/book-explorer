// Password service — pure async wrappers around bcryptjs.
// Side effects (bcrypt hashing) are isolated here at the domain service level.
// Use cases depend on these functions; they do not import bcryptjs directly.

import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

/** Hash a plain-text password. Returns a bcrypt hash string. */
export const hashPassword = (plainText: string): Promise<string> =>
  bcrypt.hash(plainText, SALT_ROUNDS);

/** Verify a plain-text password against a stored hash. */
export const verifyPassword = (plainText: string, hash: string): Promise<boolean> =>
  bcrypt.compare(plainText, hash);
