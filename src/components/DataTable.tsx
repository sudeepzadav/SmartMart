export default function DataTable({
  columns,
  rows,
}: {
  columns: string[];
  rows: (string | number)[][];
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-stone-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-stone-200 bg-stone-50 text-stone-600">
          <tr>
            {columns.map((c) => (
              <th key={c} className="px-4 py-3 font-medium">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-stone-500">
                Nothing here yet. Add your first item to get started.
              </td>
            </tr>
          )}
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-stone-100 last:border-0">
              {r.map((cell, j) => (
                <td key={j} className="px-4 py-3">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
