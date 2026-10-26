import PageHeader from "@/components/PageHeader";
import DataTable from "@/components/DataTable";

const columns = ["SKU","Name","Category","Price (Rs)","Stock"];
const rows: (string | number)[][] = [["P001","Basmati rice 5kg","Grocery",950,42],["P002","Dairy milk 1L","Dairy",120,60],["P003","Instant noodles","Snacks",30,200]];

export default function Page() {
  return (
    <>
      <PageHeader title="Products" subtitle="Everything you sell, with prices and stock." action="Add product" />
      <DataTable columns={columns} rows={rows} />
    </>
  );
}
