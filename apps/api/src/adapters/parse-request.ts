import type { ZodSchema } from "zod";
import { validationError } from "../domain/errors.js";
import type { Result } from "../domain/result.js";
import { err, ok } from "../domain/result.js";

/**
 * Pure helper — wraps Zod safeParse and returns a domain Result<T>.
 * Invalid input is mapped to a ValidationError with field-level details.
 */
export const parseRequest = <T>(schema: ZodSchema<T>, input: unknown): Result<T> => {
  const parsed = schema.safeParse(input);

  if (!parsed.success) {
    const fields = Object.fromEntries(
      parsed.error.issues.map((issue) => [issue.path.join(".") || "_root", issue.message]),
    );
    return err(validationError("Invalid request", fields));
  }

  return ok(parsed.data);
};
