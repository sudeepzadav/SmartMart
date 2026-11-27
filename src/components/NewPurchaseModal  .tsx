"use client";
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";

export type ProductOption = { id: string; name: string; costPrice: number };

export type NewPurchase = {
  supplierName: string;
  orderDate: string; // YYYY-MM-DD
  note: string;
  receiveNow: boolean;
  items: { productId: string; qty: number; unitCost: number }[];
};

type Line = { key: number; productId: string; qty: string; unitCost: string };

type Props = {
  products: ProductOption[];
  suppliers: string[]; // suppliers used before, offered as suggestions
  // Return an error message to show in the form, or nothing when the save worked.
  onSave: (p: NewPurchase) => Promise<string | void>;
  onClose: () => void;
};

const fieldClass =
  "w-full rounded-md border border-[#d49b9a] bg-white px-3 py-2 text-[#7d0e41] placeholder:text-[#aa5e78]/70 focus:border-[#7d0e41] focus:outline-2 focus:outline-offset-1 focus:outline-[#aa5e78]";

const round2 = (n: number) => Math.round(n * 100) / 100;

// Today's date in the user's own time zone, as YYYY-MM-DD.
function today() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export default function NewPurchaseModal({ products, suppliers, onSave, onClose }: Props) {
  const nextKey = useRef(2);
  const [supplier, setSupplier] = useState("");
  const [date, setDate] = useState(today);
  const [note, setNote] = useState("");
  const [receiveNow, setReceiveNow] = useState(false);
  const [lines, setLines] = useState<Line[]>([
    { key: 1, productId: "", qty: "", unitCost: "" },
  ]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const supplierRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supplierRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function updateLine(key: number, patch: Partial<Line>) {
    setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  }
  function chooseProduct(key: number, productId: string) {
    const p = products.find((x) => x.id === productId);
    // Suggest the last known cost price, the person can change it.
    setLines((ls) =>
      ls.map((l) =>
        l.key === key
          ? {
              ...l,
              productId,
              unitCost: l.unitCost === "" && p && p.costPrice > 0 ? String(p.costPrice) : l.unitCost,
            }
          : l
      )
    );
  }
  function addLine() {
    setLines((ls) => [...ls, { key: nextKey.current++, productId: "", qty: "", unitCost: "" }]);
  }
  function removeLine(key: number) {
    setLines((ls) => (ls.length > 1 ? ls.filter((l) => l.key !== key) : ls));
  }

  const total = round2(
    lines.reduce((s, l) => s + (Number(l.qty) || 0) * (parseFloat(l.unitCost) || 0), 0)
  );

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (saving) return;

    if (!supplier.trim()) return setError("Supplier is required.");
    if (!date) return setError("Choose a date.");
    const items: NewPurchase["items"] = [];
    for (const [i, l] of lines.entries()) {
      const n = i + 1;
      const qty = Number(l.qty);
      const cost = parseFloat(l.unitCost);
      if (!l.productId) return setError(`Line ${n}: choose a product.`);
      if (l.qty === "" || !Number.isInteger(qty) || qty < 1)
        return setError(`Line ${n}: quantity must be a whole number, 1 or more.`);
      if (l.unitCost === "" || !(cost >= 0))
        return setError(`Line ${n}: enter the cost price per unit.`);
      items.push({ productId: l.productId, qty, unitCost: cost });
    }

    setError("");
    setSaving(true);
    const message = await onSave({
      supplierName: supplier.trim(),
      orderDate: date,
      note: note.trim(),
      receiveNow,
      items,
    });
    setSaving(false);
    if (message) setError(message);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-purchase-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form
        onSubmit={submit}
        noValidate
        className="max-h-full w-full max-w-2xl space-y-4 overflow-y-auto rounded-xl bg-[#fcf6f2] p-6 text-[#7d0e41] shadow-lg"
      >
        <h2 id="new-purchase-title" className="text-xl font-bold">
          New purchase
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="pu-supplier" className="mb-1 block text-sm font-medium">
              Supplier
            </label>
            <input
              id="pu-supplier"
              ref={supplierRef}
              list="pu-suppliers"
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              placeholder="Himal Traders"
              className={fieldClass}
            />
            <datalist id="pu-suppliers">
              {suppliers.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </div>
          <div>
            <label htmlFor="pu-date" className="mb-1 block text-sm font-medium">
              Order date
            </label>
            <input
              id="pu-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={fieldClass}
            />
          </div>
        </div>

        <fieldset className="space-y-2">
          <legend className="mb-1 text-sm font-medium">Products ordered</legend>
          {lines.map((l, i) => (
            <div key={l.key} className="grid grid-cols-12 items-center gap-2">
              <select
                aria-label={`Line ${i + 1} product`}
                value={l.productId}
                onChange={(e) => chooseProduct(l.key, e.target.value)}
                className={fieldClass + " col-span-12 sm:col-span-6"}
              >
                <option value="">Choose a product</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <input
                aria-label={`Line ${i + 1} quantity`}
                type="number"
                min="1"
                step="1"
                placeholder="Qty"
                value={l.qty}
                onChange={(e) => updateLine(l.key, { qty: e.target.value })}
                className={fieldClass + " col-span-4 sm:col-span-2"}
              />
              <input
                aria-label={`Line ${i + 1} cost per unit`}
                type="number"
                min="0"
                step="0.01"
                placeholder="Cost (Rs)"
                value={l.unitCost}
                onChange={(e) => updateLine(l.key, { unitCost: e.target.value })}
                className={fieldClass + " col-span-5 sm:col-span-3"}
              />
              <button
                type="button"
                onClick={() => removeLine(l.key)}
                disabled={lines.length === 1}
                aria-label={`Remove line ${i + 1}`}
                className="col-span-3 rounded-md border border-[#aa5e78] bg-white py-2 text-sm hover:border-[#7d0e41] disabled:opacity-40 sm:col-span-1"
              >
                X
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addLine}
            className="rounded-md border border-[#aa5e78] bg-white px-3 py-1.5 text-sm font-medium hover:border-[#7d0e41] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7d0e41]"
          >
            + Add another product
          </button>
        </fieldset>

        <div>
          <label htmlFor="pu-note" className="mb-1 block text-sm font-medium">
            Note (optional)
          </label>
          <input
            id="pu-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Bill number, delivery details..."
            className={fieldClass}
          />
        </div>

        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={receiveNow}
            onChange={(e) => setReceiveNow(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-[#7d0e41]"
          />
          <span>
            The stock has already arrived. Add it to my stock now.
            <span className="block text-xs text-[#6b4455]">
              If unchecked, the purchase stays Pending until you mark it received.
            </span>
          </span>
        </label>

        <p className="text-right text-lg font-bold">
          Total: Rs {total.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
        </p>

        {error && (
          <p role="alert" className="text-sm font-medium text-red-700">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-[#aa5e78] bg-white px-4 py-2 font-medium hover:border-[#7d0e41] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7d0e41]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-[#7d0e41] px-4 py-2 font-semibold text-white hover:bg-[#aa5e78] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7d0e41] disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save purchase"}
          </button>
        </div>
      </form>
    </div>
  );
}