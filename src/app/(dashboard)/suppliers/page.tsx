import PageHeader from "@/components/PageHeader";
import DataTable from "@/components/DataTable";

const columns = ["Name","Phone","Owed (Rs)"];
// Sample data. Replace with a database query.
const rows: (string | number)[][] = [["Himal Traders","98XXXXXXXX",0],["Fresh Dairy Co.","98XXXXXXXX",12000]];

export default function Page() {
  return (
    <>
      <PageHeader title="Suppliers" subtitle="People and companies you buy from." action="Add supplier" />
      <DataTable columns={columns} rows={rows} />
    </>
  );
}
