import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import {
  Form,
  Link,
  isRouteErrorResponse,
  useActionData,
  useLoaderData,
  useNavigation,
  useRouteError,
} from "@remix-run/react";
import { BookCard } from "../components/BookCard.js";
import { requireUserSession } from "../session.server.js";

export const meta: MetaFunction = () => [{ title: "Search Books — Book Explorer" }];

// Cache search results for 5 min; serve stale for up to 10 min while revalidating.
export const headers = () => ({
  "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
});

const PAGE_SIZE = 10;
const API_BASE_URL = process.env["API_BASE_URL"] ?? "http://localhost:3001";

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
  bookmarkedIds: string[];
  sort: string;
  lang: string;
  filter: string;
};

export async function action(args: ActionFunctionArgs) {
  const session = await requireUserSession(args.request).catch(() => null);
  if (!session) {
    const url = new URL(args.request.url);
    return redirect(`/login?redirect_url=${encodeURIComponent(url.pathname + url.search)}`);
  }

  const formData = await args.request.formData();
  const intent = formData.get("intent");

  if (intent === "bookmark") {
    const res = await fetch(`${API_BASE_URL}/api/bookmarks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.token}`,
      },
      body: JSON.stringify({
        bookId: formData.get("bookId"),
        bookTitle: formData.get("bookTitle"),
        bookCoverUrl: formData.get("bookCoverUrl") || null,
        bookAuthors: JSON.parse(String(formData.get("bookAuthors") ?? "[]")),
      }),
    });

    if (res.status === 409) {
      return json({ error: "already_bookmarked" });
    }

    if (res.status === 201) {
      return json({ success: true });
    }

    // Unexpected API response — surface the error to the user
    return json({ error: "bookmark_failed" });
  }
  return null;
}

export async function loader(args: LoaderFunctionArgs) {
  // AC 9a: unauthenticated access → redirect to /login
  const session = await requireUserSession(args.request).catch(() => null);
  if (!session) return redirect("/login");

  const { request } = args;
  const url = new URL(request.url);
  const query = url.searchParams.get("q") ?? "";
  const page = Number(url.searchParams.get("page") ?? "1");
  const sort = url.searchParams.get("sort") ?? "relevance";
  const lang = url.searchParams.get("lang") ?? "";
  const filter = url.searchParams.get("filter") ?? "all";

  // Fetch existing bookmarks for the authenticated user
  const bookmarkedIds = await fetchBookmarkedIds(session.token);

  if (!query) {
    return json<LoaderData>({
      books: [],
      query: "",
      totalItems: 0,
      page: 1,
      pageSize: PAGE_SIZE,
      bookmarkedIds,
      sort,
      lang,
      filter,
    });
  }

  const apiUrl = new URL(`${API_BASE_URL}/api/books/search`);
  apiUrl.searchParams.set("q", query);
  apiUrl.searchParams.set("page", String(page));
  if (sort && sort !== "relevance") apiUrl.searchParams.set("sort", sort);
  if (lang) apiUrl.searchParams.set("lang", lang);
  if (filter && filter !== "all") apiUrl.searchParams.set("filter", filter);

  const response = await fetch(apiUrl.toString(), {
    headers: { Authorization: `Bearer ${session.token}` },
  });

  if (!response.ok) {
    return json<LoaderData>({
      books: [],
      query,
      totalItems: 0,
      page,
      pageSize: PAGE_SIZE,
      bookmarkedIds,
      sort,
      lang,
      filter,
    });
  }

  const data = (await response.json()) as { books: Book[]; totalItems: number; page: number };
  return json<LoaderData>({
    books: data.books,
    query,
    totalItems: data.totalItems,
    page,
    pageSize: PAGE_SIZE,
    bookmarkedIds,
    sort,
    lang,
    filter,
  });
}

const fetchBookmarkedIds = async (token: string): Promise<string[]> => {
  try {
    const bmRes = await fetch(`${API_BASE_URL}/api/bookmarks`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!bmRes.ok) return [];
    const bms = (await bmRes.json()) as Array<{ bookId: string }>;
    return bms.map((b) => b.bookId);
  } catch {
    return [];
  }
};

const selectClass =
  "bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 text-sm focus:outline-none focus:border-amber-500/50";

export default function SearchPage() {
  const { books, query, totalItems, page, pageSize, bookmarkedIds, sort, lang, filter } =
    useLoaderData<typeof loader>();
  const actionData = useActionData<{ error?: string; success?: boolean }>();
  const navigation = useNavigation();
  const isSearching = navigation.state === "loading";
  const totalPages = Math.ceil(totalItems / pageSize);

  return (
    <div>
      <div className="bg-slate-900/50 border-b border-slate-800 py-12 px-8">
        <h1 className="text-3xl font-bold text-slate-50 text-center mb-6">Search Books</h1>
        <Form method="get" action="/search">
          <div className="flex gap-3 w-full max-w-2xl mx-auto">
            <input
              type="search"
              name="q"
              defaultValue={query}
              placeholder="Search by title, author, or keyword…"
              className="flex-1 bg-slate-800 border border-slate-700 focus:border-amber-500/50 rounded-xl px-5 py-3 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-base transition-colors"
              aria-label="Search query"
            />
            <button
              type="submit"
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold px-6 py-3 rounded-xl transition-all hover:scale-105 whitespace-nowrap"
            >
              Search
            </button>
          </div>
          <details className="mt-4 w-full max-w-2xl mx-auto">
            <summary className="text-sm text-slate-500 cursor-pointer hover:text-slate-300 transition-colors">
              Filters ▾
            </summary>
            <div className="mt-3 flex flex-wrap gap-3 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
              <label className="flex flex-col gap-1 text-xs text-slate-400">
                Sort by
                <select name="sort" defaultValue={sort} className={selectClass}>
                  <option value="relevance">Relevance</option>
                  <option value="newest">Newest</option>
                </select>
              </label>
              <label className="flex flex-col gap-1 text-xs text-slate-400">
                Language
                <select name="lang" defaultValue={lang} className={selectClass}>
                  <option value="">Any</option>
                  <option value="en">English</option>
                  <option value="pt">Portuguese</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                </select>
              </label>
              <label className="flex flex-col gap-1 text-xs text-slate-400">
                Availability
                <select name="filter" defaultValue={filter} className={selectClass}>
                  <option value="all">All books</option>
                  <option value="ebooks">eBooks</option>
                  <option value="free-ebooks">Free eBooks</option>
                </select>
              </label>
            </div>
          </details>
        </Form>
      </div>

      <div className="py-8 px-8 max-w-7xl mx-auto">
        {actionData?.error && actionData.error !== "already_bookmarked" && (
          <div role="alert" className="mb-6 rounded-xl border border-red-500/40 bg-red-950/40 px-4 py-3 text-sm text-red-300">
            Failed to save bookmark. Please try again.
          </div>
        )}
        {actionData?.error === "already_bookmarked" && (
          <div role="alert" className="mb-6 rounded-xl border border-amber-500/40 bg-amber-950/40 px-4 py-3 text-sm text-amber-300">
            This book is already in your bookmarks.
          </div>
        )}
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
              <BookCard key={book.id} {...book} isBookmarked={bookmarkedIds.includes(book.id)} />
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
