FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

# ── Install all deps ──────────────────────────────────────────────────────────
FROM base AS deps
WORKDIR /app
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/domain/package.json ./packages/domain/
COPY packages/db/package.json ./packages/db/
COPY apps/api/package.json ./apps/api/
RUN pnpm install --frozen-lockfile

# ── Build ─────────────────────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/domain/node_modules ./packages/domain/node_modules
COPY --from=deps /app/packages/db/node_modules ./packages/db/node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY . .
# Generate Prisma client (writes to node_modules/.prisma/client/) then build all packages
RUN pnpm --filter @book-explorer/db db:generate && \
    pnpm --filter @book-explorer/domain build && \
    pnpm --filter @book-explorer/db build && \
    pnpm --filter @book-explorer/api build

# ── Runtime ───────────────────────────────────────────────────────────────────
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy root node_modules (shared deps + Prisma binary)
COPY --from=builder /app/node_modules ./node_modules

# Copy built workspace packages
COPY --from=builder /app/packages/domain/dist ./packages/domain/dist
COPY --from=builder /app/packages/domain/package.json ./packages/domain/package.json
COPY --from=builder /app/packages/db/dist ./packages/db/dist
COPY --from=builder /app/packages/db/package.json ./packages/db/package.json
COPY --from=builder /app/packages/db/node_modules ./packages/db/node_modules

# Copy the generated Prisma client (output path defined in schema.prisma)
# This is a predictable path that doesn't depend on pnpm store structure
COPY --from=builder /app/packages/db/generated ./packages/db/generated

# Copy Prisma schema + migrations (needed for prisma migrate deploy at startup)
COPY --from=builder /app/packages/db/prisma ./packages/db/prisma

# Copy built API
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules

# Entrypoint: runs migrations then starts the server
COPY apps/api/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

WORKDIR /app/apps/api
EXPOSE 3001
CMD ["/entrypoint.sh"]
