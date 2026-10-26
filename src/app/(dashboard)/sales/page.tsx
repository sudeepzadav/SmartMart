import PageHeader from "@/components/PageHeader";
import DataTable from "@/components/DataTable";

const columns = ["Receipt","Date","Cashier","Payment","Total (Rs)"];
const rows: (string | number)[][] = [["S-1001","2026-10-24 10:12","Asha","Cash",1240],["S-1002","2026-10-24 10:31","Asha","QR",560]];

export default function Page() {
  return (
    <>
      <PageHeader title="Sales" subtitle="Every sale made at the counter."  />
      <DataTable columns={columns} rows={rows} />
    </>
  );
}
