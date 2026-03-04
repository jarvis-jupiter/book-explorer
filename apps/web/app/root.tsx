import { ClerkApp, SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/remix";
import { rootAuthLoader } from "@clerk/remix/ssr.server";
import type { LinksFunction, LoaderFunctionArgs } from "@remix-run/node";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
  useRouteError,
} from "@remix-run/react";
import { Link } from "@remix-run/react";
import stylesheet from "./tailwind.css?url";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: stylesheet },
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
  },
];

export const loader = (args: LoaderFunctionArgs) => rootAuthLoader(args);

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="h-full bg-gray-50 text-gray-900 antialiased">
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

function Nav() {
  return (
    <nav className="border-b border-gray-200 bg-white px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <Link to="/" className="text-lg font-bold tracking-tight text-blue-600">
          📚 Book Explorer
        </Link>
        <Link to="/search" className="text-sm font-medium text-gray-600 hover:text-gray-900">
          Search
        </Link>
        <Link to="/bookmarks" className="text-sm font-medium text-gray-600 hover:text-gray-900">
          Bookmarks
        </Link>
      </div>
      <div className="flex items-center gap-3">
        <SignedOut>
          <SignInButton mode="modal">
            <button
              type="button"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
            >
              Sign In
            </button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <UserButton afterSignOutUrl="/" />
        </SignedIn>
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
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-red-600">{error.status}</h1>
          <p className="mt-2 text-gray-600">{error.statusText}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-red-600">Error</h1>
        <p className="mt-2 text-gray-600">Something went wrong.</p>
      </div>
    </div>
  );
}

export default ClerkApp(AppContent);
