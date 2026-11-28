import PageHeader from "@/components/PageHeader";
import Link from "next/link";
import { REPORTS } from "@/lib/reports";

export default function Page() {
  return (
    <>
      <PageHeader title="Reports" subtitle="Pick a report to view or export." />
      <div className="grid gap-4 md:grid-cols-2">
        {REPORTS.map((r) => (
          <Link
            key={r.slug}
            href={`/reports/${r.slug}`}
            className="rounded-lg border border-stone-200 bg-white p-5 hover:border-emerald-800"
          >
            <div className="font-medium text-black">{r.title}</div>
            <p className="mt-1 text-sm text-stone-600">{r.desc}</p>
          </Link>
        ))}
      </div>
    </>
  );
}