// Tests for the PrismaUserRepository adapter.
// Uses a mock PrismaClient — no real DB required.

import { describe, expect, it, vi } from "vitest";
import { createPrismaUserRepository } from "../user.repository.js";

const makeRow = (overrides: Record<string, unknown> = {}) => ({
  id: "cuid-1",
  email: "user@example.com",
  passwordHash: "$2a$10$hash",
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// Minimal PrismaClient mock
const makePrisma = (overrides: Record<string, unknown> = {}) =>
  ({
    user: {
      findUnique: vi.fn().mockResolvedValue(makeRow()),
      create: vi.fn().mockResolvedValue(makeRow()),
      ...overrides,
    },
  }) as unknown as import("@prisma/client").PrismaClient;

describe("createPrismaUserRepository", () => {
  describe("findByEmail", () => {
    it("returns user when found", async () => {
      const prisma = makePrisma();
      const repo = createPrismaUserRepository(prisma);

      const result = await repo.findByEmail("user@example.com");

      expect(result).not.toBeNull();
      expect(result?.email).toBe("user@example.com");
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: "user@example.com" },
      });
    });

    it("returns null when not found", async () => {
      const prisma = makePrisma({ findUnique: vi.fn().mockResolvedValue(null) });
      const repo = createPrismaUserRepository(prisma);

      const result = await repo.findByEmail("nobody@example.com");

      expect(result).toBeNull();
    });
  });

  describe("findById", () => {
    it("returns user when found", async () => {
      const prisma = makePrisma();
      const repo = createPrismaUserRepository(prisma);

      const result = await repo.findById("cuid-1");

      expect(result).not.toBeNull();
      expect(result?.id).toBe("cuid-1");
    });

    it("returns null when not found", async () => {
      const prisma = makePrisma({ findUnique: vi.fn().mockResolvedValue(null) });
      const repo = createPrismaUserRepository(prisma);

      const result = await repo.findById("nonexistent");
      expect(result).toBeNull();
    });
  });

  describe("create", () => {
    it("persists and returns the new user", async () => {
      const prisma = makePrisma();
      const repo = createPrismaUserRepository(prisma);

      const result = await repo.create("new@example.com", "hashed-password");

      expect(result.email).toBe("user@example.com");
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: { email: "new@example.com", passwordHash: "hashed-password" },
      });
    });
  });
});
