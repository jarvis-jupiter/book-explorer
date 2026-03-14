// registerUser use case.
// Depends on UserRepositoryPort (outbound port) — never imports Prisma.
// Follows functional/curried pattern: (deps) => (input) => Promise<output>

import { DuplicateEmailError } from "../domain/errors.js";
import { hashPassword } from "../domain/services/passwordService.js";
import { issueToken } from "../application/services/tokenService.js";
import type { User } from "../domain/entities/User.js";
import type { UserRepositoryPort } from "../ports/user-repository.port.js";

export type RegisterInput = {
  readonly email: string;
  readonly password: string;
};

export type RegisterOutput = {
  readonly user: User;
  readonly token: string;
};

export type RegisterUserUseCase = (input: RegisterInput) => Promise<RegisterOutput>;

/**
 * Factory: bind dependencies, return the use-case function.
 * Inner function is a pure operation — no direct I/O.
 */
export const createRegisterUserUseCase =
  (userRepo: UserRepositoryPort, jwtSecret: string): RegisterUserUseCase =>
  async ({ email, password }: RegisterInput): Promise<RegisterOutput> => {
    const existing = await userRepo.findByEmail(email);
    if (existing !== null) throw new DuplicateEmailError();

    const passwordHash = await hashPassword(password);
    const user = await userRepo.create(email, passwordHash);
    const token = issueToken(user.id, jwtSecret);

    return { user, token };
  };
