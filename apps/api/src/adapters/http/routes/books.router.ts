import { Router } from "express";
import type { Request, Response } from "express";
import { z } from "zod";
import type { SearchBooksUseCase } from "../../../use-cases/search-books.use-case.js";
import { parseRequest } from "../../parse-request.js";

// HTTP query schema — uses `q` as the URL param, coerces page/pageSize from strings
const SearchBooksHttpQuerySchema = z.object({
  q: z.string().min(1, "Search query must not be empty"),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(40).optional(),
});

const errorStatus = (kind: string): number => {
  if (kind === "ValidationError") return 400;
  if (kind === "ExternalServiceError") return 502;
  return 500;
};

export const createBooksRouter = (searchBooksUseCase: SearchBooksUseCase): Router => {
  const router = Router();

  router.get("/search", async (req: Request, res: Response): Promise<void> => {
    const parsed = parseRequest(SearchBooksHttpQuerySchema, req.query);

    if (!parsed.ok) {
      res.status(400).json({
        error: parsed.error.message,
        details: parsed.error.kind === "ValidationError" ? parsed.error.fields : [],
      });
      return;
    }

    const result = await searchBooksUseCase.execute({
      query: parsed.value.q,
      page: parsed.value.page ?? 1,
      pageSize: parsed.value.pageSize ?? 10,
    });

    if (!result.ok) {
      res.status(errorStatus(result.error.kind)).json({ error: result.error.message });
      return;
    }

    res.json(result.value);
  });

  return router;
};
