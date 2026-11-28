import CustomersView from "@/components/CustomersView";
import { db } from "@/lib/db";

// Always read fresh data, never a cached copy.
export const dynamic = "force-dynamic";

export default async function Page() {
  const customers = await db.customer.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, phone: true, balance: true },
  });

  return <CustomersView customers={customers} />;
}