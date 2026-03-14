// Auth inbound adapter — Express route handlers for registration, login, logout.
// Handles HTTP concerns (validation, status codes, error mapping).
// Never contains business logic — delegates to use cases.

import { Router } from "express";
import { z } from "zod";
import { DuplicateEmailError, InvalidCredentialsError, ValidationError } from "../../../domain/errors.js";
import type { LoginUserUseCase } from "../../../use-cases/login-user.use-case.js";
import type { RegisterUserUseCase } from "../../../use-cases/register-user.use-case.js";
import { errorResponse } from "../error-response.js";

// ── Zod validation schemas ────────────────────────────────────────────────────

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// ── Router factory ────────────────────────────────────────────────────────────

export const createAuthRouter = (
  registerUser: RegisterUserUseCase,
  loginUser: LoginUserUseCase,
): Router => {
  const router = Router();

  // POST /api/auth/register
  router.post("/register", async (req, res): Promise<void> => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      errorResponse(res, 400, "VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }

    try {
      const { user, token } = await registerUser(parsed.data);
      res.status(201).json({ token, user: { id: user.id, email: user.email } });
    } catch (err) {
      if (err instanceof DuplicateEmailError) {
        errorResponse(res, 409, "DUPLICATE_EMAIL", err.message);
        return;
      }
      if (err instanceof ValidationError) {
        errorResponse(res, 400, "VALIDATION_ERROR", err.message);
        return;
      }
      throw err;
    }
  });

  // POST /api/auth/login
  router.post("/login", async (req, res): Promise<void> => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      errorResponse(res, 400, "VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }

    try {
      const { user, token } = await loginUser(parsed.data);
      res.status(200).json({ token, user: { id: user.id, email: user.email } });
    } catch (err) {
      if (err instanceof InvalidCredentialsError) {
        errorResponse(res, 401, "INVALID_CREDENTIALS", err.message);
        return;
      }
      throw err;
    }
  });

  // POST /api/auth/logout
  // Stateless JWT — session destruction happens on the Remix side.
  // This endpoint exists for completeness and can be used for server-side
  // token invalidation in future (e.g., a deny-list).
  router.post("/logout", (_req, res): void => {
    res.status(200).json({ message: "Logged out" });
  });

  return router;
};
