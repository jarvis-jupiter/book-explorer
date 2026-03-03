# Book Explorer — Tiltfile for local development
# Requires: tilt, docker, pnpm

# ─── PostgreSQL ───────────────────────────────────────────────────────────────
docker_compose("./docker-compose.yml")

# Override with dev-friendly live-update builds
local_resource(
    "pnpm-install",
    cmd="pnpm install",
    deps=["package.json", "pnpm-workspace.yaml", "apps/api/package.json", "apps/web/package.json", "packages/domain/package.json", "packages/db/package.json"],
    labels=["setup"],
)

local_resource(
    "build-domain",
    cmd="pnpm --filter @book-explorer/domain build",
    deps=["packages/domain/src"],
    resource_deps=["pnpm-install"],
    labels=["packages"],
)

local_resource(
    "build-db",
    cmd="pnpm --filter @book-explorer/db build",
    deps=["packages/db/src", "packages/db/prisma"],
    resource_deps=["pnpm-install"],
    labels=["packages"],
)

local_resource(
    "db-migrate",
    cmd="pnpm --filter @book-explorer/db db:push",
    resource_deps=["db", "build-db"],
    labels=["database"],
)

local_resource(
    "api-dev",
    serve_cmd="pnpm --filter @book-explorer/api dev",
    deps=["apps/api/src"],
    resource_deps=["build-domain", "build-db", "db-migrate"],
    labels=["apps"],
)

local_resource(
    "web-dev",
    serve_cmd="pnpm --filter @book-explorer/web dev",
    deps=["apps/web/app"],
    resource_deps=["build-domain", "api-dev"],
    labels=["apps"],
)

local_resource(
    "tests",
    cmd="pnpm test",
    deps=["apps/api/src"],
    resource_deps=["build-domain"],
    labels=["quality"],
    trigger_mode=TRIGGER_MODE_MANUAL,
)
