import type { Response } from "express";

export type ErrorResponse = {
  readonly error: string;
  readonly code: string;
  readonly details?: unknown;
};

export const errorResponse = (
  res: Response,
  status: number,
  code: string,
  message: string,
  details?: unknown,
): void => {
  res.status(status).json({ error: message, code, details } satisfies ErrorResponse);
};
