import { Router } from "express";
import type { Request, Response } from "express";
import { z } from "zod";
import type { SearchBooksUseCase } from "../../../use-cases/search-books.use-case.js";
import { parseRequest } from "../../parse-request.js";
import { errorResponse } from "../error-response.js";

// HTTP query schema — uses `q` as the URL param, coerces page/pageSize from strings
const SearchBooksHttpQuerySchema = z.object({
  q: z.string().min(1, "Search query must not be empty"),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(40).optional(),
  sort: z.enum(["relevance", "newest"]).optional(),
  lang: z.string().optional(),
  filter: z.enum(["all", "ebooks", "free-ebooks"]).optional(),
});

const errorStatus = (kind: string): number => {
  if (kind === "ValidationError") return 400;
  if (kind === "ExternalServiceError") return 502;
  return 500;
};

const errorCode = (kind: string): string => {
  if (kind === "ValidationError") return "VALIDATION_ERROR";
  if (kind === "ExternalServiceError") return "EXTERNAL_SERVICE_ERROR";
  return "INTERNAL_ERROR";
};

export const createBooksRouter = (searchBooksUseCase: SearchBooksUseCase): Router => {
  const router = Router();

  router.get("/search", async (req: Request, res: Response): Promise<void> => {
    const parsed = parseRequest(SearchBooksHttpQuerySchema, req.query);

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

    const result = await searchBooksUseCase.execute({
      query: parsed.value.q,
      page: parsed.value.page ?? 1,
      pageSize: parsed.value.pageSize ?? 10,
      sort: parsed.value.sort,
      lang: parsed.value.lang,
      filter: parsed.value.filter,
    });

    if (!result.ok) {
      errorResponse(
        res,
        errorStatus(result.error.kind),
        errorCode(result.error.kind),
        result.error.message,
      );
      return;
    }

    res.json(result.value);
  });

  router.get("/:id", async (req: Request, res: Response): Promise<void> => {
    const id = String(req.params["id"] ?? "");
    const apiKey = process.env["GOOGLE_BOOKS_API_KEY"] ?? "";
    const url = `https://www.googleapis.com/books/v1/volumes/${encodeURIComponent(id)}?key=${apiKey}`;
    const response = await fetch(url);
    if (!response.ok) {
      errorResponse(res, 404, "NOT_FOUND", "Book not found");
      return;
    }
    const data = (await response.json()) as {
      id: string;
      volumeInfo?: {
        title?: string;
        authors?: string[];
        publisher?: string;
        description?: string;
        imageLinks?: { thumbnail?: string };
        publishedDate?: string;
        pageCount?: number;
        categories?: string[];
        averageRating?: number;
      };
    };
    const info = data.volumeInfo ?? {};
    const book = {
      id: data.id,
      title: info.title ?? "Unknown",
      authors: info.authors ?? [],
      publisher: info.publisher ?? null,
      description: info.description ?? null,
      coverUrl: info.imageLinks?.thumbnail?.replace("http:", "https:") ?? null,
      publishedDate: info.publishedDate ?? null,
      pageCount: info.pageCount ?? null,
      categories: info.categories ?? [],
      averageRating: info.averageRating ?? null,
    };
    res.json(book);
  });

  return router;
};
