"use client";
import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import DataTable from "@/components/DataTable";
import AddProductModal from "@/components/AddProductModal";
import type { ProductRecord } from "@/components/AddProductModal";

const columns = ["SKU", "Barcode", "Name", "Category", "Price (Rs)", "Stock"];

// Sample data. Replace with products loaded from your database.
const initialProducts: ProductRecord[] = [
  { sku: "P001", barcode: "8901234500011", name: "Basmati rice 5kg", category: "Grocery", price: 950, stock: 42 },
  { sku: "P002", barcode: "8901234500028", name: "Dairy milk 1L", category: "Dairy", price: 120, stock: 60 },
  { sku: "P003", barcode: "8901234500035", name: "Instant noodles", category: "Snacks", price: 30, stock: 200 },
];

export default function Page() {
  const [products, setProducts] = useState<ProductRecord[]>(initialProducts);
  const [adding, setAdding] = useState(false);

  const rows: (string | number)[][] = products.map((p) => [
    p.sku,
    p.barcode || "-",
    p.name,
    p.category,
    p.price,
    p.stock,
  ]);

  function handleSave(p: ProductRecord) {
    // TODO: save to your database first, e.g.
    // await fetch("/api/products", { method: "POST", body: JSON.stringify(p) });
    setProducts((list) => [...list, p]);
    setAdding(false);
  }

  return (
    <div className="text-[#7d0e41]">
      <PageHeader
        title="Products"
        subtitle="Everything you sell, with prices and stock."
        action="Add product"
        onAction={() => setAdding(true)}
      />

      <div className="overflow-x-auto rounded-xl border border-[#d49b9a] bg-white p-2 text-[#7d0e41] shadow-sm">
        <DataTable columns={columns} rows={rows} />
      </div>

      {adding && (
        <AddProductModal
          existing={products}
          onSave={handleSave}
          onClose={() => setAdding(false)}
        />
      )}
    </div>
  );
}