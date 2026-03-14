-- Migration: replace Clerk-based auth with custom email+password auth
-- Drops clerkId column, adds passwordHash column

-- Step 1: Drop existing users table (cascades to bookmarks FK)
DROP TABLE IF EXISTS "bookmarks";
DROP TABLE IF EXISTS "users";

-- Step 2: Recreate users with custom auth columns
CREATE TABLE "users" (
    "id"           TEXT NOT NULL,
    "email"        TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3) NOT NULL,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE INDEX "users_email_idx"        ON "users"("email");

-- Step 3: Recreate bookmarks table
CREATE TABLE "bookmarks" (
    "id"           TEXT NOT NULL,
    "userId"       TEXT NOT NULL,
    "bookId"       TEXT NOT NULL,
    "bookTitle"    TEXT NOT NULL,
    "bookCoverUrl" TEXT,
    "bookAuthors"  TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "bookmarks_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "bookmarks_userId_bookId_key" ON "bookmarks"("userId", "bookId");
CREATE INDEX "bookmarks_userId_idx"              ON "bookmarks"("userId");
CREATE INDEX "bookmarks_createdAt_idx"           ON "bookmarks"("createdAt");

ALTER TABLE "bookmarks"
    ADD CONSTRAINT "bookmarks_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
