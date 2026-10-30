import PageHeader from "@/components/PageHeader";
import DataTable from "@/components/DataTable";

const columns = ["Product","In stock","Reorder level","Status"];
const rows: (string | number)[][] = [["Basmati rice 5kg",42,20,"OK"],["Dairy milk 1L",8,15,"Low stock"],["Instant noodles",200,50,"OK"]];

export default function Page() {
  return (
    <>
      <PageHeader title="Inventory" subtitle="Current stock levels and low-stock items." action="Adjust stock" />
      <div className="bg-white text-black border=0 rounded-lg"><DataTable columns={columns} rows={rows} /></div>
    </>
  );
}
