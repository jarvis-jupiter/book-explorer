import type { DomainError } from "./errors.js";

// Lightweight Result type — avoids throwing for domain-level errors

export type Result<T> = { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: DomainError };

export const ok = <T>(value: T): Result<T> => ({ ok: true, value });
export const err = (error: DomainError): Result<never> => ({ ok: false, error });

export const mapResult = <T, U>(result: Result<T>, fn: (value: T) => U): Result<U> => {
  if (result.ok) return ok(fn(result.value));
  return result;
};
