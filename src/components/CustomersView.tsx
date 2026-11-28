"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import DataTable from "@/components/DataTable";
import AddCustomerModal from "@/components/AddCustomerModal";
import type { NewCustomer } from "@/components/AddCustomerModal";

export type CustomerRow = {
  id: string;
  name: string;
  phone: string | null;
  balance: number; // credit (udhar) the customer owes
};

const columns = ["Name", "Phone", "Credit balance (Rs)"];

export default function CustomersView({ customers }: { customers: CustomerRow[] }) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);

  const rows: (string | number)[][] = customers.map((c) => [
    c.name,
    c.phone || "—",
    c.balance,
  ]);

  // Returns an error message for the form, or nothing when saved.
  async function handleSave(data: NewCustomer): Promise<string | void> {
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) return result.error ?? "Could not save the customer.";
      setAdding(false);
      router.refresh(); // re-read the customers from the database
    } catch {
      return "Network error. Please try again.";
    }
  }

  return (
    <>
      <PageHeader
        title="Customers"
        subtitle="Regulars and credit (udhar) balances."
        action="Add customer"
        onAction={() => setAdding(true)}
      />

      <DataTable columns={columns} rows={rows} />
      {rows.length === 0 && (
        <p className="mt-3 text-sm">No customers yet. Click Add customer to start.</p>
      )}

      {adding && (
        <AddCustomerModal onSave={handleSave} onClose={() => setAdding(false)} />
      )}
    </>
  );
}