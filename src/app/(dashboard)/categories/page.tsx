"use client";
import { useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";
import DataTable from "@/components/DataTable";
import AddCategoryModal from "@/components/AddCategoryModal";

type Category = { id: string; name: string };

const columns = ["Category"];

export default function Page() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/categories");
        if (!res.ok) throw new Error("load failed");
        const data: Category[] = await res.json();
        if (!cancelled) setCategories(data);
      } catch {
        if (!cancelled) setLoadError("Could not load categories. Please refresh.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const rows: (string | number)[][] = categories.map((c) => [c.name]);

  // Returns an error message for the form, or nothing when saved.
  async function handleSave(name: string): Promise<string | void> {
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return data.error ?? "Could not save the category.";
      setCategories((list) =>
        [...list, data as Category].sort((a, b) => a.name.localeCompare(b.name))
      );
      setAdding(false);
    } catch {
      return "Network error. Please try again.";
    }
  }

  return (
    <div className="text-[#7d0e41]">
      <PageHeader
        title="Categories"
        subtitle="Groups for your products, like Grocery or Dairy."
        action="Add category"
        onAction={() => setAdding(true)}
      />

      <div className="overflow-x-auto rounded-xl border border-[#d49b9a] bg-white p-2 text-[#7d0e41] shadow-sm">
        <DataTable columns={columns} rows={rows} />
        {loading && <p className="p-3 text-sm">Loading categories...</p>}
        {!loading && !loadError && categories.length === 0 && (
          <p className="p-3 text-sm">No categories yet. Click Add category to start.</p>
        )}
        {loadError && (
          <p role="alert" className="p-3 text-sm font-medium text-red-700">
            {loadError}
          </p>
        )}
      </div>

      {adding && (
        <AddCategoryModal onSave={handleSave} onClose={() => setAdding(false)} />
      )}
    </div>
  );
}