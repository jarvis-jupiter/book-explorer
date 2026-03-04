import { defineConfig, devices } from "@playwright/test";

// Services are started externally (docker compose up --wait).
// CI: docker compose up --wait before running tests.
// Local: docker compose up -d && playwright test, or set BASE_URL env vars.
const WEB_URL = process.env["WEB_BASE_URL"] ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./tests",
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
});
