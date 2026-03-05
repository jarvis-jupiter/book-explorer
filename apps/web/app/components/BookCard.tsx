import { Link, useFetcher } from "@remix-run/react";

type BookCardProps = {
  readonly id: string;
  readonly title: string;
  readonly authors: readonly string[];
  readonly publisher: string | null;
  readonly description: string | null;
  readonly coverUrl: string | null;
  readonly bookmarked?: boolean;
  readonly isBookmarked?: boolean;
};

export function BookCard({
  id,
  title,
  authors,
  publisher,
  description,
  coverUrl,
  isBookmarked = false,
}: BookCardProps) {
  const fetcher = useFetcher<{ success?: boolean; error?: string }>();
  const isBookmarking = fetcher.state !== "idle";

  // Optimistic bookmarked state: true if already bookmarked OR if we just got a 201
  const showBookmarked =
    isBookmarked || fetcher.data?.success === true || fetcher.data?.error === "already_bookmarked";

  return (
    <li className="bg-slate-900 border border-slate-800 rounded-2xl p-4 hover:border-amber-500/30 transition-all duration-200 hover:shadow-lg hover:shadow-amber-500/5 flex gap-4 group">
      {coverUrl ? (
        <img
          src={coverUrl}
          alt={`Cover of ${title}`}
          className="rounded-lg h-32 w-24 object-cover flex-shrink-0 shadow-md"
        />
      ) : (
        <div className="bg-slate-800 rounded-lg h-32 w-24 flex items-center justify-center text-3xl flex-shrink-0">
          📖
        </div>
      )}
      <div className="flex flex-col gap-1 min-w-0 flex-1">
        <h2 className="font-semibold text-slate-100 line-clamp-2 group-hover:text-amber-300 transition-colors">
          <Link to={`/books/${id}`} className="hover:underline">
            {title}
          </Link>
        </h2>
        {authors.length > 0 && (
          <p className="text-sm text-amber-400/80 truncate">{authors.join(", ")}</p>
        )}
        {publisher && <p className="text-xs text-slate-500">{publisher}</p>}
        {description && (
          <p className="text-xs text-slate-400 mt-2 line-clamp-3 leading-relaxed">{description}</p>
        )}
        <fetcher.Form method="post" action="/search" className="mt-auto">
          <input type="hidden" name="intent" value="bookmark" />
          <input type="hidden" name="bookId" value={id} />
          <input type="hidden" name="bookTitle" value={title} />
          <input type="hidden" name="bookCoverUrl" value={coverUrl ?? ""} />
          <input type="hidden" name="bookAuthors" value={JSON.stringify(authors)} />
          {showBookmarked ? (
            <button
              type="button"
              disabled
              className="mt-3 w-full rounded-lg border border-amber-500/50 px-3 py-1.5 text-xs font-medium text-amber-300 bg-amber-500/20 cursor-default"
            >
              ✓ Bookmarked
            </button>
          ) : (
            <button
              type="submit"
              disabled={isBookmarking}
              className="mt-3 w-full rounded-lg border border-amber-500/30 px-3 py-1.5 text-xs font-medium text-amber-400 hover:bg-amber-500/10 transition-all disabled:opacity-50"
            >
              {isBookmarking ? "Saving…" : "🔖 Bookmark"}
            </button>
          )}
        </fetcher.Form>
      </div>
    </li>
  );
}
