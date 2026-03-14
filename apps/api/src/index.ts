// Composition root — wires all adapters and use cases together.
// This is the ONLY place where concrete implementations are connected to use cases.

import { prisma } from "@book-explorer/db";
import { createGoogleBooksAdapter } from "./adapters/google-books.adapter.js";
import { createPrismaBookmarkAdapter } from "./adapters/prisma-bookmark.adapter.js";
import { createPrismaUserRepository } from "./adapters/prisma/user.repository.js";
import { createApp } from "./app.js";
import { createAddBookmarkUseCase } from "./use-cases/add-bookmark.use-case.js";
import { createLoginUserUseCase } from "./use-cases/login-user.use-case.js";
import { createRegisterUserUseCase } from "./use-cases/register-user.use-case.js";
import { createRemoveBookmarkUseCase } from "./use-cases/remove-bookmark.use-case.js";
import { createSearchBooksUseCase } from "./use-cases/search-books.use-case.js";

// Validate required secrets on startup
if (!process.env["JWT_SECRET"]) {
  // biome-ignore lint/suspicious/noConsole: startup warning
  console.warn("⚠️  JWT_SECRET is not set — tokens will fail to issue");
}
if (!process.env["GOOGLE_BOOKS_API_KEY"]) {
  // biome-ignore lint/suspicious/noConsole: startup informational
  console.info("ℹ️  GOOGLE_BOOKS_API_KEY not set — using unauthenticated Google Books API (rate-limited)");
}

// Railway injects PORT; fallback to API_PORT for local dev, then 3001
const port = process.env["PORT"] ?? process.env["API_PORT"] ?? 3001;

// ── Outbound adapters (infrastructure layer) ─────────────────────────────────
const bookRepository = createGoogleBooksAdapter();
const bookmarkRepository = createPrismaBookmarkAdapter(prisma);
const userRepository = createPrismaUserRepository(prisma);

// ── Use cases (application layer) ────────────────────────────────────────────
const registerUserUseCase = createRegisterUserUseCase(userRepository);
const loginUserUseCase = createLoginUserUseCase(userRepository);
const searchBooksUseCase = createSearchBooksUseCase(bookRepository);
const addBookmarkUseCase = createAddBookmarkUseCase(bookmarkRepository);
const removeBookmarkUseCase = createRemoveBookmarkUseCase(bookmarkRepository);

// ── Inbound adapter (Express app) ─────────────────────────────────────────────
const app = createApp({
  registerUserUseCase,
  loginUserUseCase,
  searchBooksUseCase,
  addBookmarkUseCase,
  removeBookmarkUseCase,
  bookmarkRepository,
});

const server = app.listen(port, () => {
  // biome-ignore lint/suspicious/noConsole: startup log
  console.log(`✅ API listening on port ${port}`);
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
