export type UserId = string;

export type User = {
  readonly id: UserId;
  readonly clerkId: string;
  readonly email: string;
  readonly displayName: string | null;
  readonly createdAt: Date;
};
