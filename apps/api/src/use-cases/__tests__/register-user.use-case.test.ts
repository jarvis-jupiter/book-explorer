// TDD: failing tests for registerUser use case.
// Use case depends only on UserRepositoryPort — Prisma never imported here.

import { describe, expect, it, vi } from "vitest";
import { DuplicateEmailError } from "../../domain/errors.js";
import type { UserRepositoryPort } from "../../ports/user-repository.port.js";
import { createRegisterUserUseCase } from "../register-user.use-case.js";

// ── Stub implementations of UserRepositoryPort ──────────────────────────────

const makeUser = (overrides: Partial<{
  id: string; email: string; passwordHash: string; createdAt: Date;
}> = {}) => ({
  id: "user-1",
  email: "test@example.com",
  passwordHash: "$2a$10$hash",
  createdAt: new Date(),
  ...overrides,
});

const makeEmptyRepo = (): UserRepositoryPort => ({
  findByEmail: vi.fn().mockResolvedValue(null),
  findById: vi.fn().mockResolvedValue(null),
  create: vi.fn().mockResolvedValue(makeUser()),
});

const makeRepoWithExistingEmail = (email: string): UserRepositoryPort => ({
  findByEmail: vi.fn().mockResolvedValue(makeUser({ email })),
  findById: vi.fn().mockResolvedValue(null),
  create: vi.fn(),
});

// ── Tests ────────────────────────────────────────────────────────────────────

describe("registerUser use case", () => {
  it("creates a new user and returns a token when email is not taken", async () => {
    const repo = makeEmptyRepo();
    const registerUser = createRegisterUserUseCase(repo, "test-secret");

    const result = await registerUser({ email: "new@example.com", password: "password123" });

    expect(result.user.email).toBe("test@example.com"); // from stub
    expect(typeof result.token).toBe("string");
    expect(result.token.length).toBeGreaterThan(0);
    expect(repo.create).toHaveBeenCalledOnce();
  });

  it("throws DuplicateEmailError when email already exists", async () => {
    const repo = makeRepoWithExistingEmail("dupe@example.com");
    const registerUser = createRegisterUserUseCase(repo, "test-secret");

    await expect(
      registerUser({ email: "dupe@example.com", password: "password123" })
    ).rejects.toThrow(DuplicateEmailError);

    expect(repo.create).not.toHaveBeenCalled();
  });

  it("hashes the password before storing (create receives a hash, not plain text)", async () => {
    const repo = makeEmptyRepo();
    const registerUser = createRegisterUserUseCase(repo, "test-secret");

    await registerUser({ email: "a@b.com", password: "plaintext" });

    const createCall = (repo.create as ReturnType<typeof vi.fn>).mock.calls[0];
    // create(email, passwordHash)
    expect(createCall[1]).not.toBe("plaintext");
    expect(createCall[1]).toMatch(/^\$2[ab]\$\d+\$/); // bcrypt prefix
  });
});
