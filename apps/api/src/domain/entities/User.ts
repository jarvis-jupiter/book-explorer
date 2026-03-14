// User entity — pure TypeScript type, no framework imports.
// Represents the canonical user identity in the domain.
export type User = {
  readonly id: string;
  readonly email: string;
  readonly passwordHash: string;
  readonly createdAt: Date;
};
