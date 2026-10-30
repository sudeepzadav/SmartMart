import PageHeader from "@/components/PageHeader";
import DataTable from "@/components/DataTable";

const columns = ["SKU", "Name", "Category", "Price (Rs)", "Stock"];

const rows: (string | number)[][] = [
  ["P001", "Basmati rice 5kg", "Grocery", 950, 42],
  ["P002", "Dairy milk 1L", "Dairy", 120, 60],
  ["P003", "Instant noodles", "Snacks", 30, 200],
];

export default function Page() {
  return (
    <div className="text-[#7d0e41]">
      <PageHeader
        title="Products"
        subtitle="Everything you sell, with prices and stock."
        action="Add product"
      />

      <div className="overflow-x-auto rounded-xl border border-[#d49b9a] bg-white p-2 text-[#7d0e41] shadow-sm">
        <DataTable columns={columns} rows={rows} />
      </div>
    </div>
  );
}
