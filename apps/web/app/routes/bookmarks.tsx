import { getAuth } from "@clerk/remix/ssr.server";
import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

export const meta: MetaFunction = () => [{ title: "My Bookmarks — Book Explorer" }];

type Bookmark = {
  id: string;
  bookId: string;
  bookTitle: string;
  bookCoverUrl: string | null;
  bookAuthors: readonly string[];
  createdAt: string;
};

export async function loader(args: LoaderFunctionArgs) {
  const { userId, getToken } = await getAuth(args);

  if (!userId) {
    return redirect("/sign-in");
  }

  const token = await getToken();
  const apiUrl = `${process.env["API_BASE_URL"] ?? "http://localhost:3001"}/api/bookmarks`;

  const response = await fetch(apiUrl, {
    headers: { Authorization: `Bearer ${token ?? ""}` },
  });

  if (!response.ok) {
    return json({ bookmarks: [] as Bookmark[] });
  }

  const bookmarks = (await response.json()) as Bookmark[];
  return json({ bookmarks });
}

export default function BookmarksPage() {
  const { bookmarks } = useLoaderData<typeof loader>();

  return (
    <div className="mx-auto max-w-5xl p-8">
      <h1 className="text-3xl font-bold mb-6">My Bookmarks</h1>

      {bookmarks.length === 0 ? (
        <div className="text-center mt-16 text-gray-500">
          <p className="text-xl">No bookmarks yet.</p>
          <p className="mt-2">Search for books and bookmark your favourites!</p>
        </div>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {bookmarks.map((bookmark) => (
            <li
              key={bookmark.id}
              className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm flex gap-4"
            >
              {bookmark.bookCoverUrl && (
                <img
                  src={bookmark.bookCoverUrl}
                  alt={`Cover of ${bookmark.bookTitle}`}
                  className="h-28 w-20 rounded object-cover flex-shrink-0"
                />
              )}
              <div className="flex flex-col gap-1 min-w-0">
                <h2 className="font-semibold text-gray-900 truncate">{bookmark.bookTitle}</h2>
                {bookmark.bookAuthors.length > 0 && (
                  <p className="text-sm text-gray-500 truncate">
                    {bookmark.bookAuthors.join(", ")}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
