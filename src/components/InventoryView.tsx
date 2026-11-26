"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import DataTable from "@/components/DataTable";
import AdjustStockModal from "@/components/AdjustStockModal  ";
import type { StockProduct } from "@/components/AdjustStockModal  ";

const columns = ["Product", "In stock", "Reorder level", "Status"];

type Status = "Out of stock" | "Low stock" | "OK";

function statusOf(stock: number, lowStockAt: number): Status {
  if (stock <= 0) return "Out of stock";
  if (stock <= lowStockAt) return "Low stock";
  return "OK";
}

export default function InventoryView({ products }: { products: StockProduct[] }) {
  const router = useRouter();
  const [adjusting, setAdjusting] = useState(false);

  const rows: (string | number)[][] = useMemo(() => {
    // Show the items that need attention first (out of stock, then low stock).
    const rank: Record<Status, number> = { "Out of stock": 0, "Low stock": 1, OK: 2 };
    return products
      .map((p) => ({ ...p, status: statusOf(p.stock, p.lowStockAt) }))
      .sort((a, b) => rank[a.status] - rank[b.status] || a.name.localeCompare(b.name))
      .map((p) => [p.name, p.stock, p.lowStockAt, p.status]);
  }, [products]);

  // Returns an error message for the form, or nothing when saved.
  async function handleSave(
    productId: string,
    mode: "set" | "add" | "remove",
    quantity: number
  ): Promise<string | void> {
    try {
      const res = await fetch("/api/inventory/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, mode, quantity }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return data.error ?? "Could not update the stock.";
      setAdjusting(false);
      router.refresh(); // re-read the stock from the database
    } catch {
      return "Network error. Please try again.";
    }
  }

  return (
    <>
      <PageHeader
        title="Inventory"
        subtitle="Current stock levels and low-stock items."
        action="Adjust stock"
        onAction={() => setAdjusting(true)}
      />
      <div className="overflow-x-auto rounded-lg bg-white text-black">
        <DataTable columns={columns} rows={rows} />
        {rows.length === 0 && (
          <p className="p-3 text-sm">No products yet. Add some on the Products page.</p>
        )}
      </div>

      {adjusting && (
        <AdjustStockModal
          products={products}
          onSave={handleSave}
          onClose={() => setAdjusting(false)}
        />
      )}
    </>
  );
}