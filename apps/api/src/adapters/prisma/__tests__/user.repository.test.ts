import type { PrismaClient } from "@book-explorer/db";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPrismaUserRepository } from "../user.repository.js";

const mockPrismaUser = {
  id: "cuid_abc123",
  clerkId: "user_clerk123",
  email: "test@example.com",
  displayName: "Test User",
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
};

const mockPrisma = {
  user: {
    upsert: vi.fn(),
    findUnique: vi.fn(),
    delete: vi.fn(),
  },
};

const makeRepo = () => createPrismaUserRepository(mockPrisma as unknown as PrismaClient);

describe("createPrismaUserRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("upsertByClerkId", () => {
    it("returns ok with user on success", async () => {
      mockPrisma.user.upsert.mockResolvedValue(mockPrismaUser);
      const result = await makeRepo().upsertByClerkId({
        clerkId: "user_clerk123",
        email: "test@example.com",
        displayName: "Test User",
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.id).toBe("cuid_abc123");
        expect(result.value.clerkId).toBe("user_clerk123");
        expect(result.value.email).toBe("test@example.com");
      }
    });

    it("calls prisma.user.upsert with correct args", async () => {
      mockPrisma.user.upsert.mockResolvedValue(mockPrismaUser);
      await makeRepo().upsertByClerkId({
        clerkId: "user_clerk123",
        email: "test@example.com",
        displayName: null,
      });

      expect(mockPrisma.user.upsert).toHaveBeenCalledWith({
        where: { clerkId: "user_clerk123" },
        create: { clerkId: "user_clerk123", email: "test@example.com", displayName: null },
        update: { email: "test@example.com", displayName: null },
      });
    });

    it("returns err on database failure", async () => {
      mockPrisma.user.upsert.mockRejectedValue(new Error("DB error"));
      const result = await makeRepo().upsertByClerkId({
        clerkId: "user_clerk123",
        email: "test@example.com",
        displayName: null,
      });

      expect(result.ok).toBe(false);
    });
  });

  describe("findByClerkId", () => {
    it("returns ok with user when found", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockPrismaUser);
      const result = await makeRepo().findByClerkId("user_clerk123");

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value?.id).toBe("cuid_abc123");
      }
    });

    it("returns ok with null when not found", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      const result = await makeRepo().findByClerkId("user_not_found");

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBeNull();
      }
    });

    it("returns err on database failure", async () => {
      mockPrisma.user.findUnique.mockRejectedValue(new Error("DB error"));
      const result = await makeRepo().findByClerkId("user_clerk123");

      expect(result.ok).toBe(false);
    });
  });

  describe("deleteByClerkId", () => {
    it("returns ok on success", async () => {
      mockPrisma.user.delete.mockResolvedValue(mockPrismaUser);
      const result = await makeRepo().deleteByClerkId("user_clerk123");

      expect(result.ok).toBe(true);
    });

    it("returns err when user not found", async () => {
      mockPrisma.user.delete.mockRejectedValue(new Error("Record not found"));
      const result = await makeRepo().deleteByClerkId("user_not_found");

      expect(result.ok).toBe(false);
    });
  });
});
