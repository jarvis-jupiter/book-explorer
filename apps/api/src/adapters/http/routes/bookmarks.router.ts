import { CreateBookmarkInputSchema } from "@book-explorer/domain";
import { Router } from "express";
import type { Request, Response } from "express";
import type { BookmarkRepositoryPort } from "../../../ports/bookmark-repository.port.js";
import type { AddBookmarkUseCase } from "../../../use-cases/add-bookmark.use-case.js";
import type { RemoveBookmarkUseCase } from "../../../use-cases/remove-bookmark.use-case.js";
import { parseRequest } from "../../parse-request.js";
import { errorResponse } from "../error-response.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";

// Body schema — userId comes from auth middleware, not from body
const CreateBookmarkBodySchema = CreateBookmarkInputSchema.omit({ userId: true });

const addBookmarkStatusAndCode = (kind: string): [number, string] => {
  if (kind === "ValidationError") return [400, "VALIDATION_ERROR"];
  if (kind === "Conflict") return [409, "CONFLICT"];
  return [500, "INTERNAL_ERROR"];
};

const removeBookmarkStatusAndCode = (kind: string): [number, string] => {
  if (kind === "NotFound") return [404, "NOT_FOUND"];
  if (kind === "Forbidden") return [403, "FORBIDDEN"];
  return [500, "INTERNAL_ERROR"];
};

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
      errorResponse(res, 500, "INTERNAL_ERROR", result.error.message);
      return;
    }

    res.json(result.value);
  });

  router.post("/", async (req: Request, res: Response): Promise<void> => {
    const userId = (req as AuthenticatedRequest).userId;

    const parsed = parseRequest(CreateBookmarkBodySchema, req.body);

    if (!parsed.ok) {
      errorResponse(
        res,
        400,
        "VALIDATION_ERROR",
        parsed.error.message,
        parsed.error.kind === "ValidationError" ? parsed.error.fields : [],
      );
      return;
    }

    const result = await addBookmarkUseCase.execute({
      userId,
      ...parsed.value,
    });

    if (!result.ok) {
      const [status, code] = addBookmarkStatusAndCode(result.error.kind);
      errorResponse(res, status, code, result.error.message);
      return;
    }

    res.status(201).json(result.value);
  });

  router.delete("/:id", async (req: Request, res: Response): Promise<void> => {
    const userId = (req as AuthenticatedRequest).userId;
    const bookmarkId = String(req.params["id"] ?? "");

    const result = await removeBookmarkUseCase.execute({ userId, bookmarkId });

    if (!result.ok) {
      const [status, code] = removeBookmarkStatusAndCode(result.error.kind);
      errorResponse(res, status, code, result.error.message);
      return;
    }

    res.status(204).send();
  });

  return router;
};
