type BookCardProps = {
  readonly id: string;
  readonly title: string;
  readonly authors: readonly string[];
  readonly publisher: string | null;
  readonly description: string | null;
  readonly coverUrl: string | null;
};

export function BookCard({ title, authors, publisher, description, coverUrl }: BookCardProps) {
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
      <div className="flex flex-col gap-1 min-w-0">
        <h2 className="font-semibold text-slate-100 line-clamp-2 group-hover:text-amber-300 transition-colors">
          {title}
        </h2>
        {authors.length > 0 && (
          <p className="text-sm text-amber-400/80 truncate">{authors.join(", ")}</p>
        )}
        {publisher && <p className="text-xs text-slate-500">{publisher}</p>}
        {description && (
          <p className="text-xs text-slate-400 mt-2 line-clamp-3 leading-relaxed">{description}</p>
        )}
      </div>
    </li>
  );
}
