import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  Link,
  isRouteErrorResponse,
  useFetcher,
  useLoaderData,
  useNavigation,
  useRouteError,
} from "@remix-run/react";

type Book = {
  id: string;
  title: string;
  authors: string[];
  publisher: string | null;
  description: string | null;
  coverUrl: string | null;
  publishedDate: string | null;
  pageCount: number | null;
  categories: string[];
  averageRating: number | null;
};

export async function loader({ params }: LoaderFunctionArgs) {
  const id = params["id"];
  const response = await fetch(
    `${process.env["API_BASE_URL"] ?? "http://localhost:3001"}/api/books/${id}`,
  );
  if (!response.ok) throw new Response("Book not found", { status: 404 });
  const book = (await response.json()) as Book;
  return json({ book });
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  const book = data?.book;
  if (!book) return [{ title: "Book Not Found — Book Explorer" }];
  return [
    { title: `${book.title} — Book Explorer` },
    {
      name: "description",
      content: book.description?.slice(0, 160) ?? `${book.title} by ${book.authors.join(", ")}`,
    },
    { property: "og:title", content: book.title },
    { property: "og:description", content: book.description?.slice(0, 200) ?? "" },
    { property: "og:image", content: book.coverUrl ?? "" },
    { property: "og:type", content: "book" },
    { property: "books:author", content: book.authors.join(", ") },
  ];
};

export function ErrorBoundary() {
  const error = useRouteError();
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950">
      <div className="text-center space-y-4">
        <p className="text-6xl">📚</p>
        <h1 className="text-2xl font-bold text-amber-400">
          {isRouteErrorResponse(error) ? `${error.status} — ${error.statusText}` : "Error"}
        </h1>
        <p className="text-slate-400">Could not load this book.</p>
        <Link to="/search" className="text-amber-400 hover:underline">
          Back to Search
        </Link>
      </div>
    </div>
  );
}

export default function BookDetailPage() {
  const { book } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const isBookmarking = fetcher.state !== "idle";
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";

  return (
    <div
      className={`max-w-4xl mx-auto px-6 py-12 transition-opacity duration-200 ${isLoading ? "opacity-50" : "opacity-100"}`}
    >
      {/* Hero */}
      <div className="flex gap-8 items-start">
        {book.coverUrl ? (
          <img
            src={book.coverUrl}
            alt={`Cover of ${book.title}`}
            className="h-64 w-44 rounded-2xl shadow-2xl object-cover flex-shrink-0"
          />
        ) : (
          <div className="h-64 w-44 rounded-2xl shadow-2xl bg-slate-800 flex items-center justify-center text-5xl flex-shrink-0">
            📖
          </div>
        )}
        <div className="flex flex-col gap-3 min-w-0">
          <h1 className="text-3xl font-bold text-slate-50 font-display leading-tight">
            {book.title}
          </h1>
          {book.authors.length > 0 && (
            <p className="text-lg text-amber-400">{book.authors.join(", ")}</p>
          )}
          {book.publisher && <p className="text-sm text-slate-500">{book.publisher}</p>}

          <fetcher.Form method="post" action="/search" className="mt-4">
            <input type="hidden" name="intent" value="bookmark" />
            <input type="hidden" name="bookId" value={book.id} />
            <input type="hidden" name="bookTitle" value={book.title} />
            <input type="hidden" name="bookCoverUrl" value={book.coverUrl ?? ""} />
            <input type="hidden" name="bookAuthors" value={JSON.stringify(book.authors)} />
            <button
              type="submit"
              disabled={isBookmarking}
              className="rounded-lg border border-amber-500/30 px-4 py-2 text-sm font-medium text-amber-400 hover:bg-amber-500/10 transition-all disabled:opacity-50"
            >
              {isBookmarking ? "Saving…" : "🔖 Bookmark"}
            </button>
          </fetcher.Form>
        </div>
      </div>

      {/* Description */}
      {book.description && (
        <div className="mt-10">
          <h2 className="text-lg font-semibold text-slate-200 mb-3">About this book</h2>
          <p className="text-slate-400 leading-relaxed">{book.description}</p>
        </div>
      )}

      {/* Metadata grid */}
      <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
        {book.pageCount && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-slate-100">{book.pageCount}</p>
            <p className="text-xs text-slate-500 mt-1">Pages</p>
          </div>
        )}
        {book.averageRating && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-amber-400">⭐ {book.averageRating}</p>
            <p className="text-xs text-slate-500 mt-1">Rating</p>
          </div>
        )}
        {book.publishedDate && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
            <p className="text-lg font-bold text-slate-100">{book.publishedDate}</p>
            <p className="text-xs text-slate-500 mt-1">Published</p>
          </div>
        )}
        {book.categories.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
            <p className="text-sm font-bold text-slate-100 truncate">{book.categories[0]}</p>
            <p className="text-xs text-slate-500 mt-1">Category</p>
          </div>
        )}
      </div>

      <div className="mt-8">
        <Link
          to="/search"
          className="text-sm text-slate-400 hover:text-amber-400 transition-colors"
        >
          ← Back to Search
        </Link>
      </div>
    </div>
  );
}
