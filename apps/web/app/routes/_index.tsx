import type { MetaFunction } from "@remix-run/node";
import { Link } from "@remix-run/react";

export const meta: MetaFunction = () => [
  { title: "Book Explorer" },
  { name: "description", content: "Discover and bookmark your favourite books" },
];

export default function Index() {
  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-900/20 via-slate-950 to-slate-950 flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl text-center">
        <h1 className="font-display text-6xl md:text-7xl font-bold bg-gradient-to-r from-amber-300 via-amber-400 to-orange-400 bg-clip-text text-transparent">
          Book Explorer
        </h1>
        <p className="text-slate-400 text-xl mt-6 max-w-lg mx-auto leading-relaxed">
          Discover, search, and bookmark your favourite books powered by Google Books.
        </p>
        <div className="mt-10 flex gap-4 justify-center flex-wrap">
          <Link
            to="/search"
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold px-8 py-3 rounded-xl transition-all hover:scale-105"
          >
            Search Books
          </Link>
          <Link
            to="/bookmarks"
            className="border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-slate-100 px-8 py-3 rounded-xl transition-all"
          >
            My Bookmarks
          </Link>
        </div>
        <p className="mt-10 text-slate-500 text-sm">
          1M+ Books&nbsp;&nbsp;·&nbsp;&nbsp;Google Books Powered&nbsp;&nbsp;·&nbsp;&nbsp;Free
          Forever
        </p>
      </div>
    </div>
  );
}
