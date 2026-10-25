import PageHeader from "@/components/PageHeader";
import DataTable from "@/components/DataTable";

const columns = ["Name","Products"];
// Sample data. Replace with a database query.
const rows: (string | number)[][] = [["Grocery",48],["Dairy",12],["Snacks",36],["Beverages",22]];

export default function Page() {
  return (
    <>
      <PageHeader title="Categories" subtitle="Group products so they are easy to find." action="Add category" />
      <DataTable columns={columns} rows={rows} />
    </>
  );
}
