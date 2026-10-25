import PageHeader from "@/components/PageHeader";
import DataTable from "@/components/DataTable";

const columns = ["Order","Supplier","Date","Total (Rs)","Status"];
// Sample data. Replace with a database query.
const rows: (string | number)[][] = [["PO-001","Himal Traders","2026-10-20",45000,"Received"],["PO-002","Fresh Dairy Co.","2026-10-23",12000,"Pending"]];

export default function Page() {
  return (
    <>
      <PageHeader title="Purchases" subtitle="Stock you have ordered from suppliers." action="New purchase" />
      <DataTable columns={columns} rows={rows} />
    </>
  );
}
