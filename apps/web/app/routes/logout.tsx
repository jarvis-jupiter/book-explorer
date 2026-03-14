// Logout action — destroys the Remix session cookie and redirects to /login.
// No backend call required; JWT expiry is stateless.
// Reference: https://remix.run/docs/en/main/utils/sessions#destroysession

import type { ActionFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { destroySession, getSession } from "../session.server.js";

// Action-only route — no GET handler needed
export async function action({ request }: ActionFunctionArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  return redirect("/login", {
    headers: { "Set-Cookie": await destroySession(session) },
  });
}

// Fallback for direct GET navigation
export async function loader() {
  return redirect("/login");
}
