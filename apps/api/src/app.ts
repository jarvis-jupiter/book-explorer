import cors from "cors";
import express, { type Express } from "express";
import { createBookmarksRouter } from "./adapters/http/routes/bookmarks.router.js";
import { createBooksRouter } from "./adapters/http/routes/books.router.js";
import type { BookmarkRepositoryPort } from "./ports/bookmark-repository.port.js";
import type { AddBookmarkUseCase } from "./use-cases/add-bookmark.use-case.js";
import type { RemoveBookmarkUseCase } from "./use-cases/remove-bookmark.use-case.js";
import type { SearchBooksUseCase } from "./use-cases/search-books.use-case.js";

type AppDependencies = {
  readonly searchBooksUseCase: SearchBooksUseCase;
  readonly addBookmarkUseCase: AddBookmarkUseCase;
  readonly removeBookmarkUseCase: RemoveBookmarkUseCase;
  readonly bookmarkRepository: BookmarkRepositoryPort;
};

export const createApp = (deps: AppDependencies): Express => {
  const app = express();

  app.use(cors());
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
    ),
  );

  return app;
};
