import { Router } from "express";
import type { Request, Response } from "express";
import type { SearchBooksUseCase } from "../../../use-cases/search-books.use-case.js";

export const createBooksRouter = (searchBooksUseCase: SearchBooksUseCase): Router => {
  const router = Router();

  router.get("/search", async (req: Request, res: Response): Promise<void> => {
    const { q, page, pageSize } = req.query;

    const result = await searchBooksUseCase.execute({
      query: String(q ?? ""),
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 10,
    });

    if (!result.ok) {
      const status =
        result.error.kind === "ValidationError"
          ? 400
          : result.error.kind === "ExternalServiceError"
            ? 502
            : 500;
      res.status(status).json({ error: result.error.message });
      return;
    }

    res.json(result.value);
  });

  return router;
};
