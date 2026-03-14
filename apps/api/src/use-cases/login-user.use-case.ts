// loginUser use case.
// Depends on UserRepositoryPort — never imports Prisma.

import { InvalidCredentialsError } from "../domain/errors.js";
import { verifyPassword } from "../domain/services/passwordService.js";
import { issueToken } from "../application/services/tokenService.js";
import type { User } from "../domain/entities/User.js";
import type { UserRepositoryPort } from "../ports/user-repository.port.js";

export type LoginInput = {
  readonly email: string;
  readonly password: string;
};

export type LoginOutput = {
  readonly user: User;
  readonly token: string;
};

export type LoginUserUseCase = (input: LoginInput) => Promise<LoginOutput>;

export const createLoginUserUseCase =
  (userRepo: UserRepositoryPort, jwtSecret: string): LoginUserUseCase =>
  async ({ email, password }: LoginInput): Promise<LoginOutput> => {
    const user = await userRepo.findByEmail(email);
    // Always throw the same error to avoid user enumeration (AC 2b)
    if (user === null) throw new InvalidCredentialsError();

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) throw new InvalidCredentialsError();

    const token = issueToken(user.id, jwtSecret);
    return { user, token };
  };
