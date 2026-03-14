import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, isRouteErrorResponse, useLoaderData, useRouteError } from "@remix-run/react";
import { Link } from "@remix-run/react";
import { requireUserSession } from "../session.server.js";

export const meta: MetaFunction = () => [{ title: "My Bookmarks — Book Explorer" }];

const API_BASE_URL = process.env["API_BASE_URL"] ?? "http://localhost:3001";

type Bookmark = {
  id: string;
  bookId: string;
  bookTitle: string;
  bookCoverUrl: string | null;
  bookAuthors: readonly string[];
  createdAt: string;
};

export async function loader({ request }: LoaderFunctionArgs) {
  // AC 9a: unauthenticated access → redirect to /login
  const session = await requireUserSession(request);

  const response = await fetch(`${API_BASE_URL}/api/bookmarks`, {
    headers: { Authorization: `Bearer ${session.token}` },
  });

  if (!response.ok) {
    return json({ bookmarks: [] as Bookmark[] });
  }

  const bookmarks = (await response.json()) as Bookmark[];
  return json({ bookmarks });
}

export async function action({ request }: ActionFunctionArgs) {
  const session = await requireUserSession(request);

  const formData = await request.formData();
  const bookmarkId = formData.get("bookmarkId");
  const intent = formData.get("intent");

  if (intent === "remove" && bookmarkId) {
    await fetch(`${API_BASE_URL}/api/bookmarks/${bookmarkId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${session.token}` },
    });
  }

  return redirect("/bookmarks");
}

export default function BookmarksPage() {
  const { bookmarks } = useLoaderData<typeof loader>();

  return (
    <div>
      <div className="bg-slate-900/50 border-b border-slate-800 py-12 px-8">
        <h1 className="text-3xl font-bold text-slate-50 text-center">My Bookmarks</h1>
      </div>

      <div className="py-8 px-8 max-w-7xl mx-auto">
        {bookmarks.length === 0 ? (
          <div className="text-center mt-24 space-y-4">
            <p className="text-6xl">🔖</p>
            <p className="text-2xl font-semibold text-slate-300">No bookmarks yet</p>
            <p className="text-slate-500">Search for books and bookmark your favourites!</p>
            <Link
              to="/search"
              className="inline-block mt-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold px-6 py-3 rounded-xl transition-all hover:scale-105"
            >
              Find Books
            </Link>
          </div>
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {bookmarks.map((bookmark) => (
              <li
                key={bookmark.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-4 hover:border-amber-500/30 transition-all duration-200 hover:shadow-lg hover:shadow-amber-500/5 flex flex-col gap-3"
              >
                <Link to={`/books/${bookmark.bookId}`} className="flex gap-4">
                  {bookmark.bookCoverUrl ? (
                    <img
                      src={bookmark.bookCoverUrl}
                      alt={`Cover of ${bookmark.bookTitle}`}
                      className="rounded-lg h-32 w-24 object-cover flex-shrink-0 shadow-md"
                    />
                  ) : (
                    <div className="bg-slate-800 rounded-lg h-32 w-24 flex items-center justify-center text-3xl flex-shrink-0">
                      📖
                    </div>
                  )}
                  <div className="flex flex-col gap-1 min-w-0">
                    <h2 className="font-semibold text-slate-100 line-clamp-2 hover:text-amber-400 transition-colors">
                      {bookmark.bookTitle}
                    </h2>
                    {bookmark.bookAuthors.length > 0 && (
                      <p className="text-sm text-amber-400/80 truncate">
                        {bookmark.bookAuthors.join(", ")}
                      </p>
                    )}
                  </div>
                </Link>
                <Form method="post">
                  <input type="hidden" name="intent" value="remove" />
                  <input type="hidden" name="bookmarkId" value={bookmark.id} />
                  <button
                    type="submit"
                    className="text-slate-500 hover:text-red-400 text-xs border border-slate-700 hover:border-red-500/50 rounded-lg px-3 py-1.5 transition-all w-full mt-2"
                  >
                    Remove
                  </button>
                </Form>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950">
      <div className="text-center space-y-4">
        <p className="text-5xl">⚠️</p>
        <h1 className="text-2xl font-bold text-amber-400">
          {isRouteErrorResponse(error)
            ? `${error.status} — ${error.statusText}`
            : "Bookmarks Error"}
        </h1>
        <p className="text-slate-400">Something went wrong loading your bookmarks.</p>
      </div>
    </div>
  );
}
