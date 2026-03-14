// TDD: failing tests for loginUser use case.

import bcrypt from "bcryptjs";
import { describe, expect, it, vi } from "vitest";
import { InvalidCredentialsError } from "../../domain/errors.js";
import type { UserRepositoryPort } from "../../ports/user-repository.port.js";
import { createLoginUserUseCase } from "../login-user.use-case.js";

const makeHashedUser = async (email: string, plainPassword: string) => ({
  id: "user-1",
  email,
  passwordHash: await bcrypt.hash(plainPassword, 10),
  createdAt: new Date(),
});

describe("loginUser use case", () => {
  it("returns user and token when credentials are valid", async () => {
    const user = await makeHashedUser("user@example.com", "correct-pass");
    const repo: UserRepositoryPort = {
      findByEmail: vi.fn().mockResolvedValue(user),
      findById: vi.fn().mockResolvedValue(user),
      create: vi.fn(),
    };
    const loginUser = createLoginUserUseCase(repo, "test-secret");

    const result = await loginUser({ email: "user@example.com", password: "correct-pass" });

    expect(result.user.email).toBe("user@example.com");
    expect(typeof result.token).toBe("string");
    expect(result.token.length).toBeGreaterThan(0);
  });

  it("throws InvalidCredentialsError when user is not found", async () => {
    const repo: UserRepositoryPort = {
      findByEmail: vi.fn().mockResolvedValue(null),
      findById: vi.fn().mockResolvedValue(null),
      create: vi.fn(),
    };
    const loginUser = createLoginUserUseCase(repo, "test-secret");

    await expect(
      loginUser({ email: "nobody@example.com", password: "any" })
    ).rejects.toThrow(InvalidCredentialsError);
  });

  it("throws InvalidCredentialsError when password is wrong", async () => {
    const user = await makeHashedUser("user@example.com", "correct-pass");
    const repo: UserRepositoryPort = {
      findByEmail: vi.fn().mockResolvedValue(user),
      findById: vi.fn().mockResolvedValue(user),
      create: vi.fn(),
    };
    const loginUser = createLoginUserUseCase(repo, "test-secret");

    await expect(
      loginUser({ email: "user@example.com", password: "wrong-pass" })
    ).rejects.toThrow(InvalidCredentialsError);
  });

  it("error message is the same whether user missing or password wrong (AC 2b)", async () => {
    const user = await makeHashedUser("u@example.com", "right");
    const repoMissing: UserRepositoryPort = {
      findByEmail: vi.fn().mockResolvedValue(null),
      findById: vi.fn(),
      create: vi.fn(),
    };
    const repoWrongPass: UserRepositoryPort = {
      findByEmail: vi.fn().mockResolvedValue(user),
      findById: vi.fn(),
      create: vi.fn(),
    };
    const loginMissing = createLoginUserUseCase(repoMissing, "test-secret");
    const loginWrong = createLoginUserUseCase(repoWrongPass, "test-secret");

    let errMissing: Error | undefined;
    let errWrong: Error | undefined;
    try { await loginMissing({ email: "x@y.com", password: "p" }); } catch (e) { errMissing = e as Error; }
    try { await loginWrong({ email: "u@example.com", password: "bad" }); } catch (e) { errWrong = e as Error; }

    expect(errMissing?.message).toBe(errWrong?.message);
  });
});
