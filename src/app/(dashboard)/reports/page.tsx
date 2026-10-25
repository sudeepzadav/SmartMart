import PageHeader from "@/components/PageHeader";
import Link from "next/link";

const reports = [
  ["Daily sales", "Totals by day and payment type."],
  ["Profit and loss", "Sales minus purchases and expenses."],
  ["Stock valuation", "What your current stock is worth."],
  ["Top products", "Best sellers by units and revenue."],
];

export default function Page() {
  return (
    <>
      <PageHeader title="Reports" subtitle="Pick a report to view or export." />
      <div className="grid gap-4 md:grid-cols-2">
        {reports.map(([title, desc]) => (
          <Link key={title} href="/reports" className="rounded-lg border border-stone-200 bg-white p-5 hover:border-emerald-800">
            <div className="font-medium">{title}</div>
            <p className="mt-1 text-sm text-stone-600">{desc}</p>
          </Link>
        ))}
      </div>
    </>
  );
}
