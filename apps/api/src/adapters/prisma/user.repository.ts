import type { PrismaClient } from "@book-explorer/db";
import type { User } from "@book-explorer/domain";
import { internalError, notFound } from "../../domain/errors.js";
import { err, ok } from "../../domain/result.js";
import type { UpsertUserInput, UserRepositoryPort } from "../../ports/user-repository.port.js";

const toUser = (row: {
  id: string;
  clerkId: string;
  email: string;
  displayName: string | null;
  createdAt: Date;
}): User => ({
  id: row.id,
  clerkId: row.clerkId,
  email: row.email,
  displayName: row.displayName,
  createdAt: row.createdAt,
});

export const createPrismaUserRepository = (prisma: PrismaClient): UserRepositoryPort => ({
  upsertByClerkId: async (input: UpsertUserInput) => {
    try {
      const row = await prisma.user.upsert({
        where: { clerkId: input.clerkId },
        create: {
          clerkId: input.clerkId,
          email: input.email,
          displayName: input.displayName,
        },
        update: {
          email: input.email,
          displayName: input.displayName,
        },
      });
      return ok(toUser(row));
    } catch (e) {
      return err(internalError(`Failed to upsert user: ${String(e)}`));
    }
  },

  findByClerkId: async (clerkId: string) => {
    try {
      const row = await prisma.user.findUnique({ where: { clerkId } });
      return ok(row ? toUser(row) : null);
    } catch (e) {
      return err(internalError(`Failed to find user: ${String(e)}`));
    }
  },

  deleteByClerkId: async (clerkId: string) => {
    try {
      await prisma.user.delete({ where: { clerkId } });
      return ok(undefined);
    } catch {
      return err(notFound(`User with clerkId ${clerkId} not found`));
    }
  },
});
