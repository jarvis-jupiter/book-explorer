import { prisma } from "@book-explorer/db";
import { createGoogleBooksAdapter } from "./adapters/google-books.adapter.js";
import { createPrismaBookmarkAdapter } from "./adapters/prisma-bookmark.adapter.js";
import { createPrismaUserRepository } from "./adapters/prisma/user.repository.js";
import { createApp } from "./app.js";
import { createAddBookmarkUseCase } from "./use-cases/add-bookmark.use-case.js";
import { createRemoveBookmarkUseCase } from "./use-cases/remove-bookmark.use-case.js";
import { createSearchBooksUseCase } from "./use-cases/search-books.use-case.js";

// Railway injects PORT; fallback to API_PORT for local dev, then 3001
const port = process.env["PORT"] ?? process.env["API_PORT"] ?? 3001;

const bookRepository = createGoogleBooksAdapter();
const bookmarkRepository = createPrismaBookmarkAdapter(prisma);
const userRepository = createPrismaUserRepository(prisma);

const searchBooksUseCase = createSearchBooksUseCase(bookRepository);
const addBookmarkUseCase = createAddBookmarkUseCase(bookmarkRepository);
const removeBookmarkUseCase = createRemoveBookmarkUseCase(bookmarkRepository);

const app = createApp({
  searchBooksUseCase,
  addBookmarkUseCase,
  removeBookmarkUseCase,
  bookmarkRepository,
  userRepository,
});

const server = app.listen(port, () => {
  // biome-ignore lint/suspicious/noConsole: startup log is appropriate here
  console.log(`API listening on port ${port}`);
});

const shutdown = () => {
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
  // Force exit if graceful shutdown takes too long
  setTimeout(() => process.exit(1), 10_000);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
