// Domain errors — pure value types, no classes

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
