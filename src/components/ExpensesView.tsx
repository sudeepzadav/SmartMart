"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import DataTable from "@/components/DataTable";
import AddExpenseModal from "@/components/AddExpenseModal";
import type { NewExpense } from "@/components/AddExpenseModal";

export type ExpenseRow = {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  category: string | null;
  amount: number;
  note: string | null;
};

type Props = {
  expenses: ExpenseRow[];
  categories: string[];
  monthTotal: number;
};

const columns = ["Date", "What for", "Category", "Amount (Rs)", "Note"];

export default function ExpensesView({ expenses, categories, monthTotal }: Props) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);

  const rows: (string | number)[][] = expenses.map((e) => [
    e.date,
    e.title,
    e.category || "—",
    e.amount,
    e.note || "—",
  ]);

  // Returns an error message for the form, or nothing when saved.
  async function handleSave(data: NewExpense): Promise<string | void> {
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) return result.error ?? "Could not save the expense.";
      setAdding(false);
      router.refresh(); // re-read the expenses from the database
    } catch {
      return "Network error. Please try again.";
    }
  }

  return (
    <>
      <PageHeader
        title="Expenses"
        subtitle="Rent, bills, wages and other running costs."
        action="Add expense"
        onAction={() => setAdding(true)}
      />

      <p className="mb-3 text-sm font-medium">
        Total this month:{" "}
        <span className="font-bold">
          Rs {monthTotal.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
        </span>
      </p>

      <DataTable columns={columns} rows={rows} />
      {rows.length === 0 && (
        <p className="mt-3 text-sm">No expenses yet. Click Add expense to record one.</p>
      )}

      {adding && (
        <AddExpenseModal
          categories={categories}
          onSave={handleSave}
          onClose={() => setAdding(false)}
        />
      )}
    </>
  );
}