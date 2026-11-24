"use client";
import { useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";
import DataTable from "@/components/DataTable";
import AddProductModal from "@/components/AddProductModal";
import type {
  CategoryOption,
  NewProduct,
  ProductRecord,
} from "@/components/AddProductModal";

const columns = ["Barcode", "Name", "Category", "Price (Rs)", "Cost (Rs)", "Stock"];

export default function Page() {
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [adding, setAdding] = useState(false);

  // Load the saved products and categories from the database.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/products");
        if (!res.ok) throw new Error("load failed");
        const data: { products: ProductRecord[]; categories: CategoryOption[] } =
          await res.json();
        if (!cancelled) {
          setProducts(data.products);
          setCategories(data.categories);
        }
      } catch {
        if (!cancelled) setLoadError("Could not load products. Please refresh.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const rows: (string | number)[][] = products.map((p) => [
    p.barcode || "-",
    p.name,
    p.categoryName || "-",
    p.price,
    p.costPrice,
    p.stock,
  ]);

  // Returns an error message for the form, or nothing when saved.
  async function handleSave(p: NewProduct): Promise<string | void> {
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(p),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return data.error ?? "Could not save the product.";
      setProducts((list) => [...list, data as ProductRecord]);
      setAdding(false);
    } catch {
      return "Network error. Please try again.";
    }
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
        {loading && <p className="p-3 text-sm">Loading products...</p>}
        {!loading && !loadError && products.length === 0 && (
          <p className="p-3 text-sm">No products yet. Click Add product to start.</p>
        )}
        {loadError && (
          <p role="alert" className="p-3 text-sm font-medium text-red-700">
            {loadError}
          </p>
        )}
      </div>

      {adding && (
        <AddProductModal
          existing={products}
          categories={categories}
          onSave={handleSave}
          onClose={() => setAdding(false)}
        />
      )}
    </div>
  );
}