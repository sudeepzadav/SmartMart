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
    <div className="flex h-full flex-col overflow-hidden text-[#7d0e41]">
      <PageHeader
        title="Dashboard"
        subtitle="How the store is doing today."
      />

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map(([label, value], i) => (
          <div
            key={label}
            className={
              i === 0
                ? "rounded-xl bg-[#7d0e41] p-4 shadow-sm"
                : "rounded-xl border border-[#d49b9a] border-t-4 border-t-[#aa5e78] bg-white p-4 shadow-sm"
            }
          >
            <div
              className={
                i === 0
                  ? "text-sm text-[#f4d9cd]"
                  : "text-sm text-[#6b4455]"
              }
            >
              {label}
            </div>

            <div
              className={`mt-1 text-xl font-bold ${
                i === 0 ? "text-white" : "text-[#7d0e41]"
              }`}
            >
              {value}
            </div>
          </div>
        ))}
      </div>

      <h2 className="mb-3 text-lg font-semibold">
        Recent sales
      </h2>

      <div className="min-h-0 flex-1 overflow-auto rounded-lg bg-white text-[#7d0e41]">
        <DataTable
          columns={["Receipt", "Time", "Total (Rs)"]}
          rows={[
            ["S-1002", "10:31", 560],
            ["S-1001", "10:12", 1240],
          ]}
        />
      </div>
    </div>
  );
}