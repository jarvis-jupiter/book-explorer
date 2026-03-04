# syntax=docker/dockerfile:1

# ── Base: pnpm on slim Debian ─────────────────────────────────────────────────
FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

# ── Build: install all deps and compile the Remix app ─────────────────────────
FROM base AS build
WORKDIR /usr/src/app

# Copy manifests first so this layer is cached unless deps change
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/domain/package.json ./packages/domain/
COPY apps/web/package.json         ./apps/web/

# Install all deps (BuildKit cache mount speeds up CI)
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

# Copy source and build
COPY . .
RUN pnpm --filter @book-explorer/domain build && \
    pnpm --filter @book-explorer/web     build

# pnpm deploy: self-contained production directory, no pnpm symlinks
# Note: pnpm deploy uses npm-pack rules (respects .gitignore) so build/ is excluded;
# we copy it explicitly below.
RUN pnpm deploy --filter @book-explorer/web --prod /prod/web
RUN cp -r apps/web/build /prod/web/build

# ── Runtime: minimal image ────────────────────────────────────────────────────
FROM node:20-slim AS runner
ENV NODE_ENV=production

# Run as non-root user (security best practice)
RUN groupadd --system --gid 1001 nodejs && \
    useradd  --system --uid 1001 --gid nodejs nodeuser

WORKDIR /prod/web

COPY --from=build --chown=nodeuser:nodejs /prod/web .

USER nodeuser
EXPOSE 3000
CMD ["node_modules/.bin/remix-serve", "./build/server/index.js"]
