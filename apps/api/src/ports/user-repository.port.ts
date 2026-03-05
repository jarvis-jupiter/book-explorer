import type { User } from "@book-explorer/domain";
import type { Result } from "../domain/result.js";

export type UpsertUserInput = {
  readonly clerkId: string;
  readonly email: string;
  readonly displayName: string | null;
};

export type UserRepositoryPort = {
  readonly upsertByClerkId: (input: UpsertUserInput) => Promise<Result<User>>;
  readonly findByClerkId: (clerkId: string) => Promise<Result<User | null>>;
  readonly deleteByClerkId: (clerkId: string) => Promise<Result<void>>;
};
