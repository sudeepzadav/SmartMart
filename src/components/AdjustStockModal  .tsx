"use client";
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";

export type StockProduct = {
  id: string;
  name: string;
  stock: number;
  lowStockAt: number;
};

type Mode = "set" | "add" | "remove";

type Props = {
  products: StockProduct[];
  // Return an error message to show in the form, or nothing when the save worked.
  onSave: (productId: string, mode: Mode, quantity: number) => Promise<string | void>;
  onClose: () => void;
};

const fieldClass =
  "w-full rounded-md border border-[#d49b9a] bg-white px-3 py-2 text-[#7d0e41] placeholder:text-[#aa5e78]/70 focus:border-[#7d0e41] focus:outline-2 focus:outline-offset-1 focus:outline-[#aa5e78]";

export default function AdjustStockModal({ products, onSave, onClose }: Props) {
  const [productId, setProductId] = useState("");
  const [mode, setMode] = useState<Mode>("add");
  const [quantity, setQuantity] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const selectRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    selectRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const product = products.find((p) => p.id === productId);
  const qty = Number(quantity);
  const qtyValid = quantity !== "" && Number.isInteger(qty) && qty >= 0;

  // Preview of the stock after this change.
  let preview: number | null = null;
  if (product && qtyValid) {
    preview =
      mode === "set"
        ? qty
        : mode === "add"
          ? product.stock + qty
          : product.stock - qty;
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (saving) return;
    if (!product) return setError("Choose a product.");
    if (!qtyValid) return setError("Enter a whole number, 0 or more.");
    if (mode !== "set" && qty === 0) return setError("Quantity must be at least 1.");
    if (mode === "remove" && qty > product.stock)
      return setError("You cannot remove more than the current stock.");

    setError("");
    setSaving(true);
    const message = await onSave(product.id, mode, qty);
    setSaving(false);
    if (message) setError(message);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="adjust-stock-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form
        onSubmit={submit}
        noValidate
        className="w-full max-w-md space-y-4 rounded-xl bg-[#fcf6f2] p-6 text-[#7d0e41] shadow-lg"
      >
        <h2 id="adjust-stock-title" className="text-xl font-bold">
          Adjust stock
        </h2>

        <div>
          <label htmlFor="adj-product" className="mb-1 block text-sm font-medium">
            Product
          </label>
          <select
            id="adj-product"
            ref={selectRef}
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            className={fieldClass}
          >
            <option value="">Choose a product</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} (stock: {p.stock})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="adj-mode" className="mb-1 block text-sm font-medium">
            What do you want to do?
          </label>
          <select
            id="adj-mode"
            value={mode}
            onChange={(e) => setMode(e.target.value as Mode)}
            className={fieldClass}
          >
            <option value="add">Add stock (new delivery)</option>
            <option value="remove">Remove stock (damaged, expired, lost)</option>
            <option value="set">Set exact count (after a stock check)</option>
          </select>
        </div>

        <div>
          <label htmlFor="adj-qty" className="mb-1 block text-sm font-medium">
            {mode === "set" ? "New stock count" : "Quantity"}
          </label>
          <input
            id="adj-qty"
            type="number"
            min="0"
            step="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className={fieldClass}
          />
        </div>

        {preview !== null && product && (
          <p className="text-sm">
            Stock will change from <strong>{product.stock}</strong> to{" "}
            <strong>{preview}</strong>.
          </p>
        )}

        {error && (
          <p role="alert" className="text-sm font-medium text-red-700">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-3 pt-1">
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
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}