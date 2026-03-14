// Domain errors — pure value types and classes.
// The functional ADT (DomainError) is used by existing use cases.
// Auth-specific classes are used by the new auth use cases.

// ── Functional ADT (existing — used by search, bookmark use cases) ───────────

export type DomainError =
  | { readonly kind: "NotFound"; readonly message: string }
  | { readonly kind: "Unauthorized"; readonly message: string }
  | { readonly kind: "Forbidden"; readonly message: string }
  | { readonly kind: "Conflict"; readonly message: string }
  | {
      readonly kind: "ValidationError";
      readonly message: string;
      readonly fields?: Record<string, string>;
    }
  | { readonly kind: "ExternalServiceError"; readonly message: string }
  | { readonly kind: "InternalError"; readonly message: string };

export const notFound = (message: string): DomainError => ({ kind: "NotFound", message });
export const unauthorized = (message: string): DomainError => ({ kind: "Unauthorized", message });
export const forbidden = (message: string): DomainError => ({ kind: "Forbidden", message });
export const conflict = (message: string): DomainError => ({ kind: "Conflict", message });
export const validationError = (message: string, fields?: Record<string, string>): DomainError => ({
  kind: "ValidationError",
  message,
  ...(fields !== undefined ? { fields } : {}),
});
export const externalServiceError = (message: string): DomainError => ({
  kind: "ExternalServiceError",
  message,
});
export const internalError = (message: string): DomainError => ({ kind: "InternalError", message });

// ── Class-based errors for auth use cases ─────────────────────────────────────
// These are thrown (not returned) in the auth use cases, then caught by the HTTP layer.

export class DuplicateEmailError extends Error {
  readonly kind = "DuplicateEmailError" as const;
  constructor() {
    super("Email already in use");
    this.name = "DuplicateEmailError";
  }
}

export class InvalidCredentialsError extends Error {
  readonly kind = "InvalidCredentialsError" as const;
  constructor() {
    // Intentionally ambiguous — AC 2b: do not distinguish unknown email from wrong password
    super("Invalid email or password");
    this.name = "InvalidCredentialsError";
  }
}

export class ValidationError extends Error {
  readonly kind = "ValidationError" as const;
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}
