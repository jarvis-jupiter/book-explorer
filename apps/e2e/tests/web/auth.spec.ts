// E2E auth tests — covers all 7 auth scenarios from the architecture doc.
// AC 1 (Registration), AC 2 (Login), AC 8 (Logout), AC 9 (Access control)

import { expect, test } from "@playwright/test";

// ── Helpers ───────────────────────────────────────────────────────────────────

const randomEmail = () => `test-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
const VALID_PASSWORD = "password123";

// ── AC 1: Registration ────────────────────────────────────────────────────────

test.describe("Registration", () => {
  test("register - valid credentials creates account and redirects to search (AC 1a)", async ({
    page,
  }) => {
    await page.goto("/register");
    await expect(page.getByRole("heading", { name: /create account/i })).toBeVisible();

    await page.getByLabel(/email/i).fill(randomEmail());
    await page.getByLabel(/password/i).fill(VALID_PASSWORD);
    await page.getByRole("button", { name: /register/i }).click();

    // Should redirect to /search after successful registration
    await page.waitForURL(/\/search/, { timeout: 15_000 });
    await expect(page).toHaveURL(/\/search/);
  });

  test("register - duplicate email shows conflict error (AC 1b)", async ({ page }) => {
    // Use a fixed email for this test (pre-seeded or registered first)
    const email = randomEmail();

    // Register once
    await page.goto("/register");
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill(VALID_PASSWORD);
    await page.getByRole("button", { name: /register/i }).click();
    await page.waitForURL(/\/search/, { timeout: 15_000 });

    // Log out
    await page.getByRole("button", { name: /logout/i }).click();
    await page.waitForURL(/\/login/, { timeout: 10_000 });

    // Try to register again with the same email
    await page.goto("/register");
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill(VALID_PASSWORD);
    await page.getByRole("button", { name: /register/i }).click();

    // Should stay on /register with an error
    await expect(page).toHaveURL(/\/register/);
    await expect(page.getByRole("alert")).toContainText(/email already in use/i);
  });

  test("register - short password shows validation error (AC 1c)", async ({ page }) => {
    await page.goto("/register");
    await page.getByLabel(/email/i).fill(randomEmail());
    await page.getByLabel(/password/i).fill("abc"); // 3 chars — too short
    await page.getByRole("button", { name: /register/i }).click();

    // Should not redirect — stays on /register with an error about password length
    await expect(page).toHaveURL(/\/register/);
    // Either server validation or browser native validation shows an error
    const hasServerError = await page.getByRole("alert").isVisible().catch(() => false);
    const hasNativeValidation = !(await page.locator('input[name="password"]').evaluate(
      (el: HTMLInputElement) => el.validity.valid
    ));
    expect(hasServerError || hasNativeValidation).toBeTruthy();
  });
});

// ── AC 2: Login ───────────────────────────────────────────────────────────────

test.describe("Login", () => {
  test("login - correct credentials logs in and redirects to search (AC 2a)", async ({ page }) => {
    // Register an account first
    const email = randomEmail();
    await page.goto("/register");
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill(VALID_PASSWORD);
    await page.getByRole("button", { name: /register/i }).click();
    await page.waitForURL(/\/search/, { timeout: 15_000 });

    // Log out
    await page.getByRole("button", { name: /logout/i }).click();
    await page.waitForURL(/\/login/, { timeout: 10_000 });

    // Log in
    await page.goto("/login");
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill(VALID_PASSWORD);
    await page.getByRole("button", { name: /log in/i }).click();

    await page.waitForURL(/\/search/, { timeout: 15_000 });
    await expect(page).toHaveURL(/\/search/);
  });

  test("login - incorrect credentials shows ambiguous error (AC 2b)", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/email/i).fill("nobody@example.com");
    await page.getByLabel(/password/i).fill("wrongpass");
    await page.getByRole("button", { name: /log in/i }).click();

    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole("alert")).toContainText(/invalid email or password/i);
  });
});

// ── AC 8: Logout ──────────────────────────────────────────────────────────────

test.describe("Logout", () => {
  test("logout - destroys session and redirects to login (AC 8)", async ({ page }) => {
    // Register and log in
    const email = randomEmail();
    await page.goto("/register");
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill(VALID_PASSWORD);
    await page.getByRole("button", { name: /register/i }).click();
    await page.waitForURL(/\/search/, { timeout: 15_000 });

    // Logout via navbar
    await page.getByRole("button", { name: /logout/i }).click();
    await page.waitForURL(/\/login/, { timeout: 10_000 });
    await expect(page).toHaveURL(/\/login/);

    // Navigating to /search should redirect back to /login
    await page.goto("/search");
    await page.waitForURL(/\/login/, { timeout: 10_000 });
    await expect(page).toHaveURL(/\/login/);
  });
});

// ── AC 9: Access control ─────────────────────────────────────────────────────

test.describe("Access control", () => {
  test("unauthenticated user redirected from protected routes (AC 9a)", async ({ page }) => {
    // Ensure no session by using a fresh browser context

    // /search
    await page.goto("/search");
    await page.waitForURL(/\/login/, { timeout: 10_000 });
    await expect(page).toHaveURL(/\/login/);

    // /bookmarks
    await page.goto("/bookmarks");
    await page.waitForURL(/\/login/, { timeout: 10_000 });
    await expect(page).toHaveURL(/\/login/);

    // /books/:id
    await page.goto("/books/someVolumeId123");
    await page.waitForURL(/\/login/, { timeout: 10_000 });
    await expect(page).toHaveURL(/\/login/);
  });
});
