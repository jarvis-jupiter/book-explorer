type SearchFormProps = {
  readonly defaultQuery?: string;
  readonly onSubmit?: (query: string) => void;
};

export function SearchForm({ defaultQuery = "", onSubmit }: SearchFormProps) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        onSubmit?.(String(data.get("q") ?? ""));
      }}
      className="flex gap-3 mb-8"
    >
      <input
        type="search"
        name="q"
        defaultValue={defaultQuery}
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
    </form>
  );
}
