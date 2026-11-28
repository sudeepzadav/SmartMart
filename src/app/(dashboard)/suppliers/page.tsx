import SuppliersView from "@/components/SuppliersView";
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

  return <SuppliersView suppliers={suppliers} />;
}