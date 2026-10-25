export default function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: string;
}) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-stone-600">{subtitle}</p>}
      </div>
      {action && (
        <button className="rounded-md bg-emerald-800 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800">
          {action}
        </button>
      )}
    </div>
  );
}
