import PageHeader from "@/components/PageHeader";
import DataTable from "@/components/DataTable";

const columns = ["Date","Type","Note","Amount (Rs)"];
const rows: (string | number)[][] = [["2026-10-01","Rent","Shop rent",25000],["2026-10-05","Electricity","Monthly bill",3200]];

export default function Page() {
  return (
    <>
      <PageHeader title="Expenses" subtitle="Rent, wages, electricity and other costs." action="Add expense" />
      <div className="bg-white text-black border-0 rounded-lg"><DataTable columns={columns} rows={rows} /></div>
    </>
  );
}
