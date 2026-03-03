import { Router } from "express";
import type { Request, Response } from "express";
import type { BookmarkRepositoryPort } from "../../../ports/bookmark-repository.port.js";
import type { AddBookmarkUseCase } from "../../../use-cases/add-bookmark.use-case.js";
import type { RemoveBookmarkUseCase } from "../../../use-cases/remove-bookmark.use-case.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";

export const createBookmarksRouter = (
  addBookmarkUseCase: AddBookmarkUseCase,
  removeBookmarkUseCase: RemoveBookmarkUseCase,
  bookmarkRepository: BookmarkRepositoryPort,
): Router => {
  const router = Router();

  router.use(requireAuth);

  router.get("/", async (req: Request, res: Response): Promise<void> => {
    const userId = (req as AuthenticatedRequest).userId;
    const result = await bookmarkRepository.findByUserId(userId);

    if (!result.ok) {
      res.status(500).json({ error: result.error.message });
      return;
    }

    res.json(result.value);
  });

  router.post("/", async (req: Request, res: Response): Promise<void> => {
    const userId = (req as AuthenticatedRequest).userId;
    const { bookId, bookTitle, bookCoverUrl, bookAuthors } = req.body as {
      bookId?: string;
      bookTitle?: string;
      bookCoverUrl?: string | null;
      bookAuthors?: string[];
    };

    const result = await addBookmarkUseCase.execute({
      userId,
      bookId: bookId ?? "",
      bookTitle: bookTitle ?? "",
      bookCoverUrl: bookCoverUrl ?? null,
      bookAuthors: bookAuthors ?? [],
    });

    if (!result.ok) {
      const status =
        result.error.kind === "ValidationError"
          ? 400
          : result.error.kind === "Conflict"
            ? 409
            : 500;
      res.status(status).json({ error: result.error.message });
      return;
    }

    res.status(201).json(result.value);
  });

  router.delete("/:id", async (req: Request, res: Response): Promise<void> => {
    const userId = (req as AuthenticatedRequest).userId;
    const bookmarkId = String(req.params["id"] ?? "");

    const result = await removeBookmarkUseCase.execute({ userId, bookmarkId });

    if (!result.ok) {
      const status =
        result.error.kind === "NotFound" ? 404 : result.error.kind === "Forbidden" ? 403 : 500;
      res.status(status).json({ error: result.error.message });
      return;
    }

    res.status(204).send();
  });

  return router;
};
