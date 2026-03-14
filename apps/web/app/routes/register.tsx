// Registration page — custom email/password auth.
// Action calls POST /api/auth/register, stores JWT in Remix session, redirects to /search.
// Loader redirects to /search if already authenticated.
// Reference: https://remix.run/docs/en/main/route/action

import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, Link, useActionData, useNavigation } from "@remix-run/react";
import { commitSession, getSession, getUserSession, SESSION_TOKEN_KEY, SESSION_USER_EMAIL_KEY, SESSION_USER_ID_KEY } from "../session.server.js";

export const meta: MetaFunction = () => [{ title: "Register — Book Explorer" }];

const API_BASE_URL = process.env["API_BASE_URL"] ?? "http://localhost:3001";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUserSession(request);
  if (user) return redirect("/search");
  return json({});
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  // Client-side validation replication on server (AC 1c)
  if (password.length < 8) {
    return json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const body = (await res.json()) as {
      token?: string;
      user?: { id: string; email: string };
      error?: string;
    };

    if (res.status === 409) {
      return json({ error: "Email already in use" }, { status: 409 });
    }

    if (!res.ok || !body.token || !body.user) {
      return json({ error: body.error ?? "Registration failed. Please try again." }, { status: 400 });
    }

    // Store JWT in Remix session (server-side cookie — never exposed to browser JS)
    const session = await getSession(request.headers.get("Cookie"));
    session.set(SESSION_TOKEN_KEY, body.token);
    session.set(SESSION_USER_ID_KEY, body.user.id);
    session.set(SESSION_USER_EMAIL_KEY, body.user.email);

    return redirect("/search", {
      headers: { "Set-Cookie": await commitSession(session) },
    });
  } catch {
    return json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}

export default function RegisterPage() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-50">Create Account</h1>
          <p className="text-slate-400 mt-2">Join Book Explorer to start bookmarking</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
          {actionData?.error && (
            <div
              role="alert"
              className="mb-4 px-4 py-3 bg-red-900/30 border border-red-800 rounded-lg text-red-300 text-sm"
            >
              {actionData.error}
            </div>
          )}

          <Form method="post" className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="w-full bg-slate-800 border border-slate-700 focus:border-amber-500/50 rounded-xl px-4 py-3 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-colors"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                className="w-full bg-slate-800 border border-slate-700 focus:border-amber-500/50 rounded-xl px-4 py-3 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-colors"
                placeholder="At least 8 characters"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-amber-500/50 text-slate-950 font-semibold py-3 rounded-xl transition-all hover:scale-[1.02] disabled:scale-100 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Creating account…" : "Register"}
            </button>
          </Form>

          <p className="mt-4 text-center text-sm text-slate-400">
            Already have an account?{" "}
            <Link to="/login" className="text-amber-400 hover:text-amber-300 transition-colors">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
