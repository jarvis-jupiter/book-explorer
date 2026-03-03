import { prisma } from "@book-explorer/db";
import { createApp } from "./app.js";
import { createGoogleBooksAdapter } from "./adapters/google-books.adapter.js";
import { createPrismaBookmarkAdapter } from "./adapters/prisma-bookmark.adapter.js";
import { createSearchBooksUseCase } from "./use-cases/search-books.use-case.js";
import { createAddBookmarkUseCase } from "./use-cases/add-bookmark.use-case.js";
import { createRemoveBookmarkUseCase } from "./use-cases/remove-bookmark.use-case.js";

const PORT = process.env["API_PORT"] ?? 3001;

const bookRepository = createGoogleBooksAdapter();
const bookmarkRepository = createPrismaBookmarkAdapter(prisma);

const searchBooksUseCase = createSearchBooksUseCase(bookRepository);
const addBookmarkUseCase = createAddBookmarkUseCase(bookmarkRepository);
const removeBookmarkUseCase = createRemoveBookmarkUseCase(bookmarkRepository);

const app = createApp({
  searchBooksUseCase,
  addBookmarkUseCase,
  removeBookmarkUseCase,
  bookmarkRepository,
});

app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});
