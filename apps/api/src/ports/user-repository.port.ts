// UserRepositoryPort — outbound port interface for user persistence.
// Use cases depend on this interface; Prisma is in the infrastructure layer.
// No Prisma imports are permitted here.

import type { User } from "../domain/entities/User.js";

export interface UserRepositoryPort {
  /** Find a user by email. Returns null if not found. */
  findByEmail(email: string): Promise<User | null>;
  /** Find a user by their DB id. Returns null if not found. */
  findById(id: string): Promise<User | null>;
  /** Persist a new user record. */
  create(email: string, passwordHash: string): Promise<User>;
}
