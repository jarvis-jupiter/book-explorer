import { defineConfig, devices } from "@playwright/test";

const API_URL = process.env["API_BASE_URL"] ?? "http://localhost:3001";
const WEB_URL = process.env["WEB_BASE_URL"] ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./tests",
  // Parallel in CI; serial locally by default
  fullyParallel: true,
  forbidOnly: !!process.env["CI"],
  retries: process.env["CI"] ? 1 : 0,
  workers: process.env["CI"] ? 2 : undefined,
  reporter: process.env["CI"] ? [["github"], ["html", { open: "never" }]] : "list",

  use: {
    baseURL: WEB_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  // Start API + Web servers before running tests.
  // Playwright waits for the URL to be reachable before starting tests.
  webServer: [
    {
      // API: run compiled output (build is done before E2E in CI via turbo build --force)
      command: "pnpm --filter @book-explorer/api start",
      url: `${API_URL}/health`,
      reuseExistingServer: !process.env["CI"],
      env: {
        API_PORT: "3001",
        PORT: "3001",
        DATABASE_URL:
          process.env["DATABASE_URL"] ??
          "postgresql://postgres:postgres@localhost:5432/book_explorer_test",
        GOOGLE_BOOKS_API_KEY: process.env["GOOGLE_BOOKS_API_KEY"] ?? "",
        NODE_ENV: "test",
      },
      timeout: 90_000,
    },
    {
      // Web: build domain + web, then serve with remix-serve
      command:
        "pnpm --filter @book-explorer/domain build && pnpm --filter @book-explorer/web build && pnpm --filter @book-explorer/web start",
      url: WEB_URL,
      reuseExistingServer: !process.env["CI"],
      env: {
        PORT: "3000",
        API_BASE_URL: API_URL,
        NODE_ENV: "production",
        // Clerk placeholder keys — pages requiring auth will redirect rather than error
        CLERK_PUBLISHABLE_KEY: process.env["CLERK_PUBLISHABLE_KEY"] ?? "pk_test_placeholder",
        CLERK_SECRET_KEY: process.env["CLERK_SECRET_KEY"] ?? "sk_test_placeholder",
      },
      timeout: 180_000,
    },
  ],
});
