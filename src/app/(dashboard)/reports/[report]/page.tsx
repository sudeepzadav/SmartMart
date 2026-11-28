import { notFound } from "next/navigation";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import DataTable from "@/components/DataTable";
import { buildReport } from "@/lib/reports";

// Always read fresh data, never a cached copy.
export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ report: string }>;
  searchParams: Promise<{ from?: string; to?: string; sort?: string }>;
};

const inputClass =
  "rounded-md border border-stone-300 bg-white px-3 py-2 text-black focus:border-emerald-800 focus:outline-2 focus:outline-offset-1 focus:outline-emerald-800";

export default async function Page({ params, searchParams }: Props) {
  const { report: slug } = await params;
  const report = await buildReport(slug, await searchParams);
  if (!report) notFound();

  return (
    <>
      <PageHeader title={report.title} subtitle={report.desc} />

      <div className="mb-4 flex flex-wrap items-end justify-between gap-3 text-black">
        <form method="get" className="flex flex-wrap items-end gap-3">
          {report.needsRange && (
            <>
              <label className="flex flex-col gap-1 text-sm">
                From
                <input type="date" name="from" defaultValue={report.from} className={inputClass} />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                To
                <input type="date" name="to" defaultValue={report.to} className={inputClass} />
              </label>
            </>
          )}
          {report.slug === "top-products" && (
            <label className="flex flex-col gap-1 text-sm">
              Rank by
              <select name="sort" defaultValue={report.sort} className={inputClass}>
                <option value="revenue">Revenue</option>
                <option value="units">Units sold</option>
              </select>
            </label>
          )}
          {(report.needsRange || report.slug === "top-products") && (
            <button
              type="submit"
              className="rounded-md bg-[#7d0e41] px-4 py-2 font-semibold text-white hover:bg-[#aa5e78] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7d0e41]"
            >
              Show report
            </button>
          )}
        </form>

        <div className="flex items-center gap-4 text-sm">
          <Link href="/reports" className="underline">
            All reports
          </Link>
          <a
            href={`/api/reports/${report.slug}${report.query ? `?${report.query}` : ""}`}
            className="rounded-md border border-[#7d0e41] px-4 py-2 font-semibold text-[#7d0e41] hover:bg-[#f4d9cd] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7d0e41]"
          >
            Export CSV
          </a>
        </div>
      </div>

      <DataTable columns={report.columns} rows={report.rows} />
      {report.rows.length === 0 && (
        <p className="mt-3 text-sm text-black">No data for this report yet.</p>
      )}

      {report.notes.length > 0 && (
        <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-stone-600">
          {report.notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      )}
    </>
  );
}