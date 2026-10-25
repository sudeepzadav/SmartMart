import PageHeader from "@/components/PageHeader";
import DataTable from "@/components/DataTable";

const stats = [
  ["Today's sales", "Rs 24,300"],
  ["Orders today", "38"],
  ["Low-stock items", "5"],
  ["Expenses this month", "Rs 41,200"],
];

export default function Page() {
  return (
    <>
      <PageHeader title="Dashboard" subtitle="How the store is doing today." />
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(([label, value]) => (
          <div key={label} className="rounded-lg border border-stone-200 bg-white p-4">
            <div className="text-sm text-stone-600">{label}</div>
            <div className="mt-1 text-2xl font-semibold">{value}</div>
          </div>
        ))}
      </div>
      <h2 className="mb-3 text-lg font-medium">Recent sales</h2>
      <DataTable
        columns={["Receipt", "Time", "Total (Rs)"]}
        rows={[["S-1002", "10:31", 560], ["S-1001", "10:12", 1240]]}
      />
    </>
  );
}
