import type { MetaFunction } from "@remix-run/node";
import { Link } from "@remix-run/react";

export const meta: MetaFunction = () => [
  { title: "Book Explorer" },
  { name: "description", content: "Discover and bookmark your favourite books" },
];

export default function Index() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-2xl text-center">
        <h1 className="text-5xl font-bold tracking-tight">📚 Book Explorer</h1>
        <p className="mt-4 text-xl text-gray-600">
          Discover, search, and bookmark your favourite books powered by Google Books.
        </p>
        <div className="mt-8 flex gap-4 justify-center">
          <Link
            to="/search"
            className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            Search Books
          </Link>
          <Link
            to="/bookmarks"
            className="rounded-lg border border-gray-300 px-6 py-3 font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
          >
            My Bookmarks
          </Link>
        </div>
      </div>
    </div>
  );
}
