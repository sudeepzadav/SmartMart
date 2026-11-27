"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import NewPurchaseModal from "@/components/NewPurchaseModal  ";
import type { NewPurchase, ProductOption } from "@/components/NewPurchaseModal  ";

export type PurchaseRow = {
  id: string;
  orderNo: string;
  supplierName: string;
  orderDate: string; // YYYY-MM-DD
  total: number;
  status: string; // Pending | Received | Cancelled
};

type Props = {
  purchases: PurchaseRow[];
  products: ProductOption[];
  suppliers: string[];
};

const statusClass: Record<string, string> = {
  Received: "text-green-800",
  Pending: "font-semibold text-[#7d0e41]",
  Cancelled: "text-gray-500",
};

const th = "px-4 py-3 text-left text-sm font-medium text-[#6b4455]";
const td = "px-4 py-3 text-sm";

export default function PurchasesView({ purchases, products, suppliers }: Props) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [actionError, setActionError] = useState("");

  // Returns an error message for the form, or nothing when saved.
  async function handleSave(p: NewPurchase): Promise<string | void> {
    try {
      const res = await fetch("/api/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(p),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return data.error ?? "Could not save the purchase.";
      setAdding(false);
      router.refresh(); // re-read the purchases from the database
    } catch {
      return "Network error. Please try again.";
    }
  }

  async function act(row: PurchaseRow, action: "receive" | "cancel") {
    const question =
      action === "receive"
        ? `Mark ${row.orderNo} as received? This adds the stock to your products.`
        : `Cancel ${row.orderNo}? No stock will be added.`;
    if (!window.confirm(question)) return;

    setBusyId(row.id);
    setActionError("");
    try {
      const res = await fetch(`/api/purchases/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setActionError(data.error ?? "Could not update the purchase.");
      else router.refresh();
    } catch {
      setActionError("Network error. Please try again.");
    } finally {
      setBusyId("");
    }
  }

  return (
    <>
      <PageHeader
        title="Purchases"
        subtitle="Stock you have ordered from suppliers."
        action="New purchase"
        onAction={() => setAdding(true)}
      />

      {actionError && (
        <p role="alert" className="mb-3 text-sm font-medium text-red-700">
          {actionError}
        </p>
      )}

      <div className="overflow-x-auto rounded-lg bg-white text-black">
        <table className="w-full">
          <thead className="border-b border-[#f4d9cd]">
            <tr>
              <th className={th}>Order</th>
              <th className={th}>Supplier</th>
              <th className={th}>Date</th>
              <th className={th}>Total (Rs)</th>
              <th className={th}>Status</th>
              <th className={th}>
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {purchases.map((p) => (
              <tr key={p.id} className="border-b border-[#f4d9cd] last:border-0">
                <td className={td}>{p.orderNo}</td>
                <td className={td}>{p.supplierName}</td>
                <td className={td}>{p.orderDate}</td>
                <td className={td}>{p.total.toLocaleString("en-IN")}</td>
                <td className={`${td} ${statusClass[p.status] ?? ""}`}>{p.status}</td>
                <td className={`${td} whitespace-nowrap text-right`}>
                  {p.status === "Pending" && (
                    <span className="flex justify-end gap-2">
                      <button
                        onClick={() => act(p, "receive")}
                        disabled={busyId === p.id}
                        className="rounded-md bg-[#7d0e41] px-3 py-1 text-xs font-semibold text-white hover:bg-[#aa5e78] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7d0e41] disabled:opacity-50"
                      >
                        Mark received
                      </button>
                      <button
                        onClick={() => act(p, "cancel")}
                        disabled={busyId === p.id}
                        className="rounded-md border border-[#aa5e78] px-3 py-1 text-xs font-medium text-[#7d0e41] hover:border-[#7d0e41] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7d0e41] disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {purchases.length === 0 && (
          <p className="p-4 text-sm">
            No purchases yet. Click New purchase to record one.
          </p>
        )}
      </div>

      {adding && (
        <NewPurchaseModal
          products={products}
          suppliers={suppliers}
          onSave={handleSave}
          onClose={() => setAdding(false)}
        />
      )}
    </>
  );
}