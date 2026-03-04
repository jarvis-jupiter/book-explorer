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
# resolved to real files (no pnpm symlinks).
RUN pnpm deploy --filter @book-explorer/api --prod /prod/api

# Copy dist/ (excluded by pnpm deploy's npm-pack rules via .gitignore)
RUN cp -r apps/api/dist /prod/api/dist

# Copy Prisma schema + migrations so prisma generate can run inside /prod/api
RUN cp -r packages/db/prisma /prod/api/prisma

# Run prisma generate INSIDE the deployment directory so the native query
# engine binary lands in exactly the right path within /prod/api/node_modules.
# This is the only reliable way — copying from workspace node_modules is fragile
# because the pnpm flat path includes a hash of all peer dependencies.
WORKDIR /prod/api
RUN node_modules/.bin/prisma generate --schema prisma/schema.prisma

WORKDIR /usr/src/app

# ── Runtime: minimal image with only what the app needs ───────────────────────
FROM node:20-slim AS runner
ENV NODE_ENV=production

# Prisma query engine needs openssl at runtime
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl && \
    rm -rf /var/lib/apt/lists/*

# Run as non-root user (security best practice)
RUN groupadd --system --gid 1001 nodejs && \
    useradd  --system --uid 1001 --gid nodejs nodeuser

WORKDIR /prod/api

# Copy the fully-prepared deployment from the build stage:
# - node_modules with all production deps (pnpm deploy)
# - dist/ (compiled TypeScript)
# - prisma/ (schema + migrations, needed for migrate deploy at startup)
# - .prisma/client/ (generated query engine, created by prisma generate in build)
COPY --from=build --chown=nodeuser:nodejs /prod/api .

# Entrypoint: prisma generate → prisma migrate deploy → node dist/index.js
COPY --chown=nodeuser:nodejs apps/api/entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

USER nodeuser
EXPOSE 3001
CMD ["./entrypoint.sh"]
