# syntax=docker/dockerfile:1

# ── Base: pnpm on slim Debian (glibc — matches Prisma's native binaries) ──────
FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

# ── Build: install all deps, generate Prisma client, compile TypeScript ────────
FROM base AS build
# openssl needed for Prisma to detect the correct query engine platform
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl && \
    rm -rf /var/lib/apt/lists/*
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

# Generate Prisma client (in workspace), then compile all workspace packages
RUN pnpm --filter @book-explorer/db db:generate && \
    pnpm --filter @book-explorer/domain build  && \
    pnpm --filter @book-explorer/db      build  && \
    pnpm --filter @book-explorer/api     build

# pnpm deploy: self-contained production directory with real files (no symlinks)
RUN pnpm deploy --filter @book-explorer/api --prod /prod/api

# Copy dist/ (excluded by pnpm deploy's npm-pack rules via .gitignore)
RUN cp -r apps/api/dist /prod/api/dist

# Copy Prisma schema + migrations (needed for migrate deploy at runtime)
RUN cp -r packages/db/prisma /prod/api/prisma

# Copy the generated Prisma client (.prisma/client/) from the workspace into
# the deployment's node_modules. The pnpm flat path includes a hash of peer
# deps so we find the target directory dynamically.
# @prisma/client resolves .prisma/client as a sibling of @prisma/ in node_modules
# i.e. …/node_modules/.prisma/client (NOT …/node_modules/@prisma/.prisma/client)
RUN PRISMA_SRC=$(find node_modules/.pnpm -path "*/@prisma+client*/node_modules/.prisma/client" -type d | head -1) && \
    PRISMA_NM=$(find /prod/api/node_modules/.pnpm -path "*/@prisma+client*/node_modules/@prisma/client" -type d | head -1 | sed 's|/node_modules/@prisma/client$|/node_modules|') && \
    echo "Copying generated Prisma client:" && \
    echo "  from: $PRISMA_SRC" && \
    echo "  to:   $PRISMA_NM/.prisma/client" && \
    mkdir -p "$PRISMA_NM/.prisma/client" && \
    cp -r "$PRISMA_SRC"/* "$PRISMA_NM/.prisma/client/"

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

# Copy the fully-prepared deployment from the build stage
COPY --from=build --chown=nodeuser:nodejs /prod/api .

# Entrypoint: prisma migrate deploy → node dist/index.js
COPY --chown=nodeuser:nodejs apps/api/entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

USER nodeuser
EXPOSE 3001
CMD ["./entrypoint.sh"]
