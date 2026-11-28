"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import DataTable from "@/components/DataTable";
import AddSupplierModal from "@/components/AddSupplierModa";

export type SupplierRow = { id: string; name: string; phone: string | null };

const columns = ["Name", "Phone", "Owed (Rs)"];

export default function SuppliersView({ suppliers }: { suppliers: SupplierRow[] }) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);

  const rows: (string | number)[][] = suppliers.map((s) => [
    s.name,
    s.phone || "—",
    "—",
  ]);

  // Returns an error message for the form, or nothing when saved.
  async function handleSave(data: { name: string; phone: string }): Promise<string | void> {
    try {
      const res = await fetch("/api/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) return result.error ?? "Could not save the supplier.";
      setAdding(false);
      router.refresh(); // re-read the suppliers from the database
    } catch {
      return "Network error. Please try again.";
    }
  }

  return (
    <>
      <PageHeader
        title="Suppliers"
        subtitle="People and companies you buy from."
        action="Add supplier"
        onAction={() => setAdding(true)}
      />

      <DataTable columns={columns} rows={rows} />
      {rows.length === 0 && (
        <p className="mt-3 text-sm">No suppliers yet. Click Add supplier to start.</p>
      )}

      {adding && (
        <AddSupplierModal onSave={handleSave} onClose={() => setAdding(false)} />
      )}
    </>
  );
}