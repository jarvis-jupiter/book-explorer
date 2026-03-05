import { Prisma, type PrismaClient } from "@book-explorer/db";
import type { Bookmark, BookmarkId, CreateBookmarkInput, UserId } from "@book-explorer/domain";
import { conflict, notFound } from "../domain/errors.js";
import { err, ok } from "../domain/result.js";
import type { BookmarkRepositoryPort } from "../ports/bookmark-repository.port.js";

const toBookmark = (row: {
  id: string;
  userId: string;
  bookId: string;
  bookTitle: string;
  bookCoverUrl: string | null;
  bookAuthors: string[];
  createdAt: Date;
}): Bookmark => ({
  id: row.id,
  userId: row.userId,
  bookId: row.bookId,
  bookTitle: row.bookTitle,
  bookCoverUrl: row.bookCoverUrl,
  bookAuthors: row.bookAuthors,
  createdAt: row.createdAt,
});

export const createPrismaBookmarkAdapter = (prisma: PrismaClient): BookmarkRepositoryPort => ({
  findById: async (id: BookmarkId) => {
    const row = await prisma.bookmark.findUnique({ where: { id } });
    if (!row) return err(notFound(`Bookmark ${id} not found`));
    return ok(toBookmark(row));
  },

  findByUserId: async (userId: UserId) => {
    const rows = await prisma.bookmark.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return ok(rows.map(toBookmark));
  },

  findByUserAndBook: async (userId: UserId, bookId: string) => {
    const row = await prisma.bookmark.findUnique({
      where: { userId_bookId: { userId, bookId } },
    });
    return ok(row ? toBookmark(row) : null);
  },

  create: async (input: CreateBookmarkInput) => {
    try {
      const row = await prisma.bookmark.create({
        data: {
          userId: input.userId,
          bookId: input.bookId,
          bookTitle: input.bookTitle,
          bookCoverUrl: input.bookCoverUrl,
          bookAuthors: input.bookAuthors as string[],
        },
      });
      return ok(toBookmark(row));
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        return err(conflict("Bookmark already exists for this book"));
      }
      throw e;
    }
  },

  deleteById: async (id: BookmarkId) => {
    try {
      await prisma.bookmark.delete({ where: { id } });
      return ok(undefined);
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
        return err(notFound(`Bookmark ${id} not found`));
      }
      throw e;
    }
  },
});
