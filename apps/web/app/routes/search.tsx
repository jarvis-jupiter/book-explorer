import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, useLoaderData, useNavigation } from "@remix-run/react";

export const meta: MetaFunction = () => [{ title: "Search Books — Book Explorer" }];

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
};

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q") ?? "";
  const page = Number(url.searchParams.get("page") ?? "1");

  if (!query) {
    return json<LoaderData>({ books: [], query: "", totalItems: 0, page: 1 });
  }

  const apiUrl = new URL(`${process.env["API_BASE_URL"] ?? "http://localhost:3001"}/api/books/search`);
  apiUrl.searchParams.set("q", query);
  apiUrl.searchParams.set("page", String(page));

  const response = await fetch(apiUrl.toString());

  if (!response.ok) {
    return json<LoaderData>({ books: [], query, totalItems: 0, page });
  }

  const data = await response.json() as { books: Book[]; totalItems: number; page: number };
  return json<LoaderData>({ books: data.books, query, totalItems: data.totalItems, page });
}

export default function SearchPage() {
  const { books, query, totalItems, page } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isSearching = navigation.state === "loading";

  return (
    <div className="mx-auto max-w-5xl p-8">
      <h1 className="text-3xl font-bold mb-6">Search Books</h1>

      <Form method="get" className="flex gap-3 mb-8">
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Search by title, author, or keyword…"
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Search query"
        />
        <button
          type="submit"
          className="rounded-lg bg-blue-600 px-6 py-2 font-semibold text-white hover:bg-blue-700"
        >
          Search
        </button>
      </Form>

      {isSearching && <p className="text-gray-500">Searching…</p>}

      {!isSearching && query && (
        <p className="mb-4 text-gray-600">
          {totalItems} result{totalItems !== 1 ? "s" : ""} for <strong>&ldquo;{query}&rdquo;</strong>
        </p>
      )}

      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {books.map((book) => (
          <li
            key={book.id}
            className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm flex gap-4"
          >
            {book.coverUrl && (
              <img
                src={book.coverUrl}
                alt={`Cover of ${book.title}`}
                className="h-28 w-20 rounded object-cover flex-shrink-0"
              />
            )}
            <div className="flex flex-col gap-1 min-w-0">
              <h2 className="font-semibold text-gray-900 truncate">{book.title}</h2>
              {book.authors.length > 0 && (
                <p className="text-sm text-gray-500 truncate">{book.authors.join(", ")}</p>
              )}
              {book.publisher && (
                <p className="text-xs text-gray-400">{book.publisher}</p>
              )}
              {book.description && (
                <p className="text-xs text-gray-600 mt-1 line-clamp-3">{book.description}</p>
              )}
            </div>
          </li>
        ))}
      </ul>

      {books.length === 0 && query && !isSearching && (
        <p className="text-center text-gray-500 mt-12">No books found. Try a different search.</p>
      )}
    </div>
  );
}
