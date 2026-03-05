import { Form } from "@remix-run/react";

type SearchFormProps = {
  readonly defaultQuery?: string;
};

export function SearchForm({ defaultQuery = "" }: SearchFormProps) {
  return (
    <Form method="get" action="/search" className="flex gap-3 w-full max-w-2xl mx-auto">
      <input
        type="search"
        name="q"
        defaultValue={defaultQuery}
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
    </Form>
  );
}
