import InventoryView from "@/components/InventoryView";
import { db } from "@/lib/db"; // change this if your db.ts exports the client under another name

// Always read fresh stock numbers, never a cached copy.
export const dynamic = "force-dynamic";

export default async function Page() {
  const products = await db.product.findMany({
    where: { active: true },
    select: { id: true, name: true, stock: true, lowStockAt: true },
    orderBy: { name: "asc" },
  });

  return <InventoryView products={products} />;
}