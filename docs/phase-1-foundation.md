# Phase 1: Monorepo Foundation

## Status: 🔴 TDD Red Phase

This phase establishes the full monorepo scaffold. The failing tests define the contracts
for Phase 2 (green phase — implement the use cases).

## Checklist

- [x] Turborepo + pnpm workspaces
- [x] TypeScript strict mode (`tsconfig.base.json`)
- [x] Biome linting/formatting
- [x] `packages/domain` — shared types
- [x] `packages/db` — Prisma client wrapper + schema
- [x] `apps/api` — Express.js hexagonal skeleton
- [x] `apps/web` — Remix + Tailwind CSS + Clerk
- [x] TDD red tests: `searchBooks`, `addBookmark`
- [x] Docker Compose (`api`, `web`, `db`)
- [x] Tiltfile for local dev
- [x] Root README

## Next: Phase 2

- Implement `searchBooks` use case (green)
- Implement `addBookmark` use case (green)
- Write tests for `removeBookmark` and `listBookmarks`
- Wire up Prisma migrations
