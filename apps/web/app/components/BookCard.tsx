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
    <li className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm flex gap-4">
      {coverUrl && (
        <img
          src={coverUrl}
          alt={`Cover of ${title}`}
          className="h-28 w-20 rounded object-cover flex-shrink-0"
        />
      )}
      <div className="flex flex-col gap-1 min-w-0">
        <h2 className="font-semibold text-gray-900 truncate">{title}</h2>
        {authors.length > 0 && (
          <p className="text-sm text-gray-500 truncate">{authors.join(", ")}</p>
        )}
        {publisher && <p className="text-xs text-gray-400">{publisher}</p>}
        {description && <p className="text-xs text-gray-600 mt-1 line-clamp-3">{description}</p>}
      </div>
    </li>
  );
}
