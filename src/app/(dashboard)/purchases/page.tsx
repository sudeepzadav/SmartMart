import PurchasesView from "@/components/PurchasesView";
import { db } from "@/lib/db"; // change this if your db.ts exports the client under another name

// Always read fresh data, never a cached copy.
export const dynamic = "force-dynamic";

export default async function Page() {
  const [purchases, products] = await Promise.all([
    db.purchase.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        orderNo: true,
        supplierName: true,
        orderDate: true,
        total: true,
        status: true,
      },
    }),
    db.product.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, costPrice: true },
    }),
  ]);

  const rows = purchases.map((p) => ({
    id: p.id,
    orderNo: p.orderNo,
    supplierName: p.supplierName,
    orderDate: p.orderDate.toISOString().slice(0, 10), // 2026-11-26
    total: p.total,
    status: p.status,
  }));
  const suppliers = Array.from(new Set(purchases.map((p) => p.supplierName)));

  return <PurchasesView purchases={rows} products={products} suppliers={suppliers} />;
}