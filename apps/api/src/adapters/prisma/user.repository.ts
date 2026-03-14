// PrismaUserRepository — outbound adapter implementing UserRepositoryPort.
// This is the ONLY file in the codebase that imports Prisma client for user operations.
// Use cases receive this via dependency injection and never import Prisma directly.

import type { PrismaClient } from "@prisma/client";
import type { User } from "../../domain/entities/User.js";
import type { UserRepositoryPort } from "../../ports/user-repository.port.js";

const toUser = (row: {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
}): User => ({
  id: row.id,
  email: row.email,
  passwordHash: row.passwordHash,
  createdAt: row.createdAt,
});

export const createPrismaUserRepository = (prisma: PrismaClient): UserRepositoryPort => ({
  findByEmail: async (email: string): Promise<User | null> => {
    const row = await prisma.user.findUnique({ where: { email } });
    return row ? toUser(row) : null;
  },

  findById: async (id: string): Promise<User | null> => {
    const row = await prisma.user.findUnique({ where: { id } });
    return row ? toUser(row) : null;
  },

  create: async (email: string, passwordHash: string): Promise<User> => {
    const row = await prisma.user.create({ data: { email, passwordHash } });
    return toUser(row);
  },
});
