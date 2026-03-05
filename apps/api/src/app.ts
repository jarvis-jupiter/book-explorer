import compression from "compression";
import cors from "cors";
import express, { type Express } from "express";
import type { ErrorRequestHandler } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import "express-async-errors";
import { createBookmarksRouter } from "./adapters/http/routes/bookmarks.router.js";
import { createBooksRouter } from "./adapters/http/routes/books.router.js";
import { createWebhooksRouter } from "./adapters/http/routes/webhooks.router.js";
import type { BookmarkRepositoryPort } from "./ports/bookmark-repository.port.js";
import type { UserRepositoryPort } from "./ports/user-repository.port.js";
import type { AddBookmarkUseCase } from "./use-cases/add-bookmark.use-case.js";
import type { RemoveBookmarkUseCase } from "./use-cases/remove-bookmark.use-case.js";
import type { SearchBooksUseCase } from "./use-cases/search-books.use-case.js";

type AppDependencies = {
  readonly searchBooksUseCase: SearchBooksUseCase;
  readonly addBookmarkUseCase: AddBookmarkUseCase;
  readonly removeBookmarkUseCase: RemoveBookmarkUseCase;
  readonly bookmarkRepository: BookmarkRepositoryPort;
  readonly userRepository: UserRepositoryPort;
};

export const createApp = (deps: AppDependencies): Express => {
  const app = express();

  // Security headers
  app.use(helmet());

  // Gzip all responses
  app.use(compression());

  // Rate limiters — disabled in test/CI to prevent E2E flakiness
  const isTest = process.env["NODE_ENV"] === "test" || process.env["CI"] === "true";

  if (!isTest) {
    const globalLimiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: "Too many requests", code: "RATE_LIMIT_EXCEEDED" },
    });

    const searchLimiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 30,
      message: { error: "Too many search requests", code: "RATE_LIMIT_EXCEEDED" },
    });

    app.use(globalLimiter);
    app.use("/api/books/search", searchLimiter);
  }

  app.use(cors());

  // Webhooks route uses raw body — must be mounted BEFORE express.json()
  app.use("/api/webhooks", createWebhooksRouter(deps.userRepository));

  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/books", createBooksRouter(deps.searchBooksUseCase));
  app.use(
    "/api/bookmarks",
    createBookmarksRouter(
      deps.addBookmarkUseCase,
      deps.removeBookmarkUseCase,
      deps.bookmarkRepository,
      deps.userRepository,
    ),
  );

  // Centralised error handler — must be last middleware (4-argument signature)
  const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
    const isDev = process.env["NODE_ENV"] !== "production";
    const status = (err as { status?: number }).status ?? 500;
    res.status(status).json({
      error: isDev ? String((err as Error).message) : "Internal server error",
      code: "INTERNAL_ERROR",
      ...(isDev && { stack: String((err as Error).stack) }),
    });
  };
  app.use(errorHandler);

  return app;
};
