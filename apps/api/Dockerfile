# syntax=docker/dockerfile:1

# ── Base: pnpm on slim Debian (glibc — matches Prisma's native binaries) ──────
FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

# ── Build: install all deps, generate Prisma client, compile TypeScript ────────
FROM base AS build
WORKDIR /usr/src/app

# Copy manifests first so this layer is cached unless deps change
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/domain/package.json ./packages/domain/
COPY packages/db/package.json      ./packages/db/
COPY apps/api/package.json         ./apps/api/

# Install all deps (BuildKit cache mount speeds up CI; falls back to layer cache)
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Generate Prisma client, then compile all workspace packages
RUN pnpm --filter @book-explorer/db db:generate && \
    pnpm --filter @book-explorer/domain build  && \
    pnpm --filter @book-explorer/db      build  && \
    pnpm --filter @book-explorer/api     build

# pnpm deploy: creates a self-contained directory with all production deps
# resolved to real files (no pnpm symlinks) — this is the officially recommended
# approach for deploying a pnpm monorepo service to production.
# Note: pnpm deploy uses npm-pack rules (respects .gitignore) so dist/ is excluded;
# we copy it explicitly below.
RUN pnpm deploy --filter @book-explorer/api --prod /prod/api
RUN cp -r apps/api/dist /prod/api/dist

# ── Runtime: minimal image with only what the app needs ───────────────────────
FROM node:20-slim AS runner
ENV NODE_ENV=production
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

# Run as non-root user (security best practice)
RUN groupadd --system --gid 1001 nodejs && \
    useradd  --system --uid 1001 --gid nodejs nodeuser

WORKDIR /prod/api

# Copy the self-contained deployment from the build stage
COPY --from=build --chown=nodeuser:nodejs /prod/api .

# Prisma schema + migrations needed at startup for prisma migrate deploy
COPY --from=build --chown=nodeuser:nodejs /usr/src/app/packages/db/prisma ./prisma

USER nodeuser
EXPOSE 3001
# Note: set Railway's Pre-Deploy Command to:
#   node_modules/.bin/prisma migrate deploy --schema prisma/schema.prisma
CMD ["node", "dist/index.js"]
