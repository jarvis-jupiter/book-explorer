import { getAuth } from "@clerk/remix/ssr.server";
import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import {
  Link,
  isRouteErrorResponse,
  useLoaderData,
  useNavigation,
  useRouteError,
} from "@remix-run/react";
import { BookCard } from "../components/BookCard.js";
import { SearchForm } from "../components/SearchForm.js";

export const meta: MetaFunction = () => [{ title: "Search Books — Book Explorer" }];

const PAGE_SIZE = 10;

type Book = {
  id: string;
  title: string;
  authors: readonly string[];
  publisher: string | null;
  description: string | null;
  coverUrl: string | null;
};

type LoaderData = {
  books: Book[];
  query: string;
  totalItems: number;
  page: number;
  pageSize: number;
};

export async function action(args: ActionFunctionArgs) {
  const { userId, getToken } = await getAuth(args);
  if (!userId) return redirect("/sign-in");

  const formData = await args.request.formData();
  const intent = formData.get("intent");

  if (intent === "bookmark") {
    const token = await getToken();
    await fetch(`${process.env["API_BASE_URL"] ?? "http://localhost:3001"}/api/bookmarks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token ?? ""}`,
      },
      body: JSON.stringify({
        bookId: formData.get("bookId"),
        bookTitle: formData.get("bookTitle"),
        bookCoverUrl: formData.get("bookCoverUrl") || null,
        bookAuthors: JSON.parse(String(formData.get("bookAuthors") ?? "[]")),
      }),
    });
  }
  return null;
}

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q") ?? "";
  const page = Number(url.searchParams.get("page") ?? "1");

  if (!query) {
    return json<LoaderData>({ books: [], query: "", totalItems: 0, page: 1, pageSize: PAGE_SIZE });
  }

  const apiUrl = new URL(
    `${process.env["API_BASE_URL"] ?? "http://localhost:3001"}/api/books/search`,
  );
  apiUrl.searchParams.set("q", query);
  apiUrl.searchParams.set("page", String(page));

  const response = await fetch(apiUrl.toString());

  if (!response.ok) {
    return json<LoaderData>({ books: [], query, totalItems: 0, page, pageSize: PAGE_SIZE });
  }

  const data = (await response.json()) as { books: Book[]; totalItems: number; page: number };
  return json<LoaderData>({
    books: data.books,
    query,
    totalItems: data.totalItems,
    page,
    pageSize: PAGE_SIZE,
  });
}

export default function SearchPage() {
  const { books, query, totalItems, page, pageSize } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isSearching = navigation.state === "loading";
  const totalPages = Math.ceil(totalItems / pageSize);

  return (
    <div>
      <div className="bg-slate-900/50 border-b border-slate-800 py-12 px-8">
        <h1 className="text-3xl font-bold text-slate-50 text-center mb-6">Search Books</h1>
        <SearchForm defaultQuery={query} />
      </div>

      <div className="py-8 px-8 max-w-7xl mx-auto">
        {isSearching && (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {["s1", "s2", "s3", "s4", "s5", "s6"].map((key) => (
              <li
                key={key}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex gap-4 animate-pulse"
              >
                <div className="bg-slate-800 rounded-lg h-32 w-24 flex-shrink-0" />
                <div className="flex flex-col gap-2 flex-1">
                  <div className="h-4 bg-slate-800 rounded w-3/4" />
                  <div className="h-3 bg-slate-800 rounded w-1/2" />
                  <div className="h-3 bg-slate-800 rounded w-1/3" />
                </div>
              </li>
            ))}
          </ul>
        )}

        {!isSearching && query && (
          <p className="mb-4 text-slate-400">
            <span className="text-amber-400 font-semibold">{totalItems}</span> result
            {totalItems !== 1 ? "s" : ""} for{" "}
            <strong className="text-slate-200">&ldquo;{query}&rdquo;</strong>
          </p>
        )}

        {!isSearching && (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {books.map((book) => (
              <BookCard key={book.id} {...book} />
            ))}
          </ul>
        )}

        {!isSearching && books.length === 0 && query && (
          <div className="text-center mt-24 space-y-4">
            <p className="text-6xl">📚</p>
            <p className="text-2xl font-semibold text-slate-300">No books found</p>
            <p className="text-slate-500">Try a different search term or check your spelling.</p>
          </div>
        )}

        {!isSearching && !query && (
          <div className="text-center mt-24 space-y-4">
            <p className="text-6xl">🔍</p>
            <p className="text-2xl font-semibold text-slate-300">Search for books</p>
            <p className="text-slate-500">
              Enter a title, author, or keyword above to get started.
            </p>
          </div>
        )}

        {!isSearching && totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-12">
            {page > 1 && (
              <Link
                to={`/search?q=${encodeURIComponent(query)}&page=${page - 1}`}
                className="px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:border-amber-500/50 hover:text-amber-400 transition-all"
              >
                ← Previous
              </Link>
            )}
            <span className="text-slate-500 text-sm">
              Page {page} of {totalPages}
            </span>
            {page < totalPages && (
              <Link
                to={`/search?q=${encodeURIComponent(query)}&page=${page + 1}`}
                className="px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:border-amber-500/50 hover:text-amber-400 transition-all"
              >
                Next →
              </Link>
            )}
          </div>
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
          {isRouteErrorResponse(error) ? `${error.status} — ${error.statusText}` : "Search Error"}
        </h1>
        <p className="text-slate-400">Something went wrong loading search results.</p>
      </div>
    </div>
  );
}
