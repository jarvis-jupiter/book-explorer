// Remix session storage — stores JWT from the backend in a signed, HttpOnly cookie.
// The JWT never reaches the browser as raw text; it's sealed inside the session cookie.
// Reference: https://remix.run/docs/en/main/utils/sessions

import { createCookieSessionStorage, redirect } from "@remix-run/node";

// Exported for testing
export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "__session",
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7, // 7 days — matches JWT TTL
    path: "/",
    sameSite: "lax",
    secrets: [process.env["SESSION_SECRET"] ?? "default-secret-change-me"],
    secure: process.env["NODE_ENV"] === "production",
  },
});

export const { getSession, commitSession, destroySession } = sessionStorage;

// ── Session helpers ───────────────────────────────────────────────────────────

export const SESSION_TOKEN_KEY = "token";
export const SESSION_USER_ID_KEY = "userId";
export const SESSION_USER_EMAIL_KEY = "userEmail";

export type SessionUser = {
  readonly token: string;
  readonly userId: string;
  readonly email: string;
};

/**
 * Retrieve the current user session.
 * Returns null if no valid session exists.
 */
export const getUserSession = async (request: Request): Promise<SessionUser | null> => {
  const session = await getSession(request.headers.get("Cookie"));
  const token = session.get(SESSION_TOKEN_KEY);
  const userId = session.get(SESSION_USER_ID_KEY);
  const email = session.get(SESSION_USER_EMAIL_KEY);

  if (!token || !userId || !email) return null;
  return { token, userId, email };
};

/**
 * Guard: ensure the user is authenticated.
 * Throws a redirect to /login if not authenticated.
 * Use in every protected loader/action.
 */
export const requireUserSession = async (request: Request): Promise<SessionUser> => {
  const user = await getUserSession(request);
  if (!user) throw redirect("/login");
  return user;
};
