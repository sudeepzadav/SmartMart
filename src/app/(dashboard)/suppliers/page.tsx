
import PageHeader from "@/components/PageHeader";
import DataTable from "@/components/DataTable";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function Page() {
  const suppliers = await db.supplier.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      phone: true,
    },
  });

  const columns = ["Name", "Phone", "Owed (Rs)"];

  const rows: (string | number)[][] = suppliers.map((supplier) => [
    supplier.name,
    supplier.phone || "—",
    "—",
  ]);

  return (
    <>
      <PageHeader
        title="Suppliers"
        subtitle="People and companies you buy from."
        action="Add supplier"
      />

      <DataTable columns={columns} rows={rows} />
    </>
  );
}
