import PageHeader from "@/components/PageHeader";
import DataTable from "@/components/DataTable";

const columns = ["Name","Phone","Credit balance (Rs)"];
// Sample data. Replace with a database query.
const rows: (string | number)[][] = [["Ram Shrestha","98XXXXXXXX",1500],["Sita Rai","98XXXXXXXX",0]];

export default function Page() {
  return (
    <>
      <PageHeader title="Customers" subtitle="Regulars and credit (udhar) balances." action="Add customer" />
      <DataTable columns={columns} rows={rows} />
    </>
  );
}
