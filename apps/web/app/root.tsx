import type { LinksFunction, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  Form,
  Link,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
  useLoaderData,
  useRouteError,
} from "@remix-run/react";
import { getUserSession } from "./session.server.js";
import stylesheet from "./tailwind.css?url";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: stylesheet },
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@700&display=swap",
  },
];

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUserSession(request);
  return json({ isAuthenticated: user !== null, userEmail: user?.email ?? null });
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="h-full bg-slate-950 text-slate-50 antialiased">
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

function Nav() {
  const { isAuthenticated, userEmail } = useLoaderData<typeof loader>();

  return (
    <nav className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800/50 sticky top-0 z-50 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <Link
          to="/"
          className="text-lg font-bold tracking-tight bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent"
        >
          📚 Book Explorer
        </Link>
        {isAuthenticated && (
          <>
            <Link
              to="/search"
              className="text-slate-400 hover:text-slate-100 transition-colors text-sm font-medium"
            >
              Search
            </Link>
            <Link
              to="/bookmarks"
              className="text-slate-400 hover:text-slate-100 transition-colors text-sm font-medium"
            >
              Bookmarks
            </Link>
          </>
        )}
      </div>
      <div className="flex items-center gap-3">
        {!isAuthenticated ? (
          <>
            <Link
              to="/register"
              className="text-sm text-slate-400 hover:text-slate-100 transition-colors"
            >
              Register
            </Link>
            <Link
              to="/login"
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold rounded-lg px-4 py-1.5 text-sm transition-colors"
            >
              Log In
            </Link>
          </>
        ) : (
          <div className="flex items-center gap-3">
            {userEmail && (
              <span className="text-xs text-slate-500 hidden sm:block">{userEmail}</span>
            )}
            <Form method="post" action="/logout">
              <button
                type="submit"
                className="text-sm text-slate-400 hover:text-slate-100 border border-slate-700 hover:border-slate-500 rounded-lg px-3 py-1.5 transition-all"
              >
                Logout
              </button>
            </Form>
          </div>
        )}
      </div>
    </nav>
  );
}

function AppContent() {
  return (
    <>
      <Nav />
      <Outlet />
    </>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-amber-400">{error.status}</h1>
          <p className="mt-2 text-slate-400">{error.statusText}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-amber-400">Error</h1>
        <p className="mt-2 text-slate-400">Something went wrong.</p>
      </div>
    </div>
  );
}

export default AppContent;
