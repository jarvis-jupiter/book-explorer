# 📚 Book Explorer

A production-quality full-stack monorepo for discovering and bookmarking books, powered by the Google Books API.

## Tech Stack

| Layer        | Technology                              |
|-------------|------------------------------------------|
| Monorepo     | Turborepo + pnpm workspaces             |
| Frontend     | Remix, Tailwind CSS, Clerk auth         |
| Backend      | Express.js, hexagonal architecture      |
| Database     | PostgreSQL via Prisma                   |
| Language     | TypeScript (strict mode throughout)     |
| Testing      | Vitest (TDD red → green → refactor)     |
| Linting      | Biome                                   |
| Local dev    | Docker Compose + Tilt                   |

## Architecture

The API follows **hexagonal architecture** (ports & adapters):

```
apps/api/src/
├── domain/          # Pure domain types & errors (no I/O)
├── ports/           # Interfaces (inbound & outbound)
├── adapters/        # Concrete implementations (Prisma, Google Books, HTTP)
└── use-cases/       # Application logic (pure, testable)
```

## Packages

| Package               | Description                            |
|----------------------|----------------------------------------|
| `packages/domain`    | Shared TypeScript types (Book, Bookmark, User) |
| `packages/db`        | Prisma client wrapper                  |
| `apps/api`           | Express.js REST API                    |
| `apps/web`           | Remix web application                  |

## Getting Started

### Prerequisites

- Node.js ≥ 20
- pnpm ≥ 9 (`corepack enable`)
- Docker & Docker Compose

### Setup

```bash
# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env
# Edit .env with your Clerk keys and Google Books API key

# Start the database
docker compose up db -d

# Push the Prisma schema
pnpm --filter @book-explorer/db db:push

# Start development servers
pnpm dev
```

### Local Development with Tilt

```bash
tilt up
```

Tilt will manage the full dev lifecycle: dependency builds, migrations, live-reloading API & web servers, and on-demand test runs.

### Running Tests

```bash
# All tests
pnpm test

# Watch mode (API)
pnpm --filter @book-explorer/api test:watch
```

## Features

- 🔍 **Search books** — full-text search via Google Books API with pagination
- 📖 **Book details** — cover, title, author, publisher, description
- 🔖 **Bookmarks** — add/remove favourites, persisted to PostgreSQL
- 🔐 **Auth** — Clerk on the frontend, JWT verification on the backend
- 🌐 **Public API** — works without a Google Books API key (rate-limited)

## Environment Variables

See [`.env.example`](.env.example) for all required and optional variables.

## Git Workflow

- `main` — stable, protected branch
- Feature branches: `feat/<description>`
- Conventional Commits: `feat:`, `fix:`, `chore:`, `test:`, `refactor:`, `docs:`
- PRs required for all changes to `main`

## Phases

- **Phase 1** ✅ Monorepo foundation, hexagonal API scaffold, TDD red tests
- **Phase 2** — TDD green: implement `searchBooks` & `addBookmark`
- **Phase 3** — Full UI: search page, bookmark management
- **Phase 4** — Auth integration, deployment hardening

## License

MIT
