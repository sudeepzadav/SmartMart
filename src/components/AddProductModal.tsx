"use client";
import { useEffect, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent, ReactNode } from "react";

export type CategoryOption = { id: string; name: string };

// A product as saved in the database and shown in the table.
export type ProductRecord = {
  id: string;
  barcode: string;
  name: string;
  categoryId: string;
  categoryName: string;
  price: number;
  costPrice: number;
  stock: number;
  lowStockAt: number;
};

// What the form sends when saving.
export type NewProduct = {
  barcode: string;
  name: string;
  categoryId: string;
  price: number;
  costPrice: number;
  stock: number;
  lowStockAt: number;
};

type Props = {
  existing: ProductRecord[]; // used to block a duplicate barcode
  categories: CategoryOption[];
  // Return an error message to show in the form, or nothing when the save worked.
  onSave: (p: NewProduct) => Promise<string | void>;
  onClose: () => void;
};

type Errors = Partial<Record<keyof NewProduct, string>>;

const fieldClass =
  "w-full rounded-md border border-[#d49b9a] bg-white px-3 py-2 text-[#7d0e41] placeholder:text-[#aa5e78]/70 focus:border-[#7d0e41] focus:outline-2 focus:outline-offset-1 focus:outline-[#aa5e78]";

function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium">
        {label}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-[#6b4455]">{hint}</p>}
      {error && (
        <p id={`${id}-error`} className="mt-1 text-xs text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

export default function AddProductModal({
  existing,
  categories,
  onSave,
  onClose,
}: Props) {
  const [barcode, setBarcode] = useState("");
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [price, setPrice] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [stock, setStock] = useState("");
  const [lowStockAt, setLowStockAt] = useState("5");
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const barcodeRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    barcodeRef.current?.focus(); // ready for the scanner straight away
    function onKey(e: globalThis.KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // A barcode scanner types the code and presses Enter. Don't submit the form
  // on that Enter; just move on to the next field.
  function onBarcodeKey(e: KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      nameRef.current?.focus();
    }
  }

  function validate(): Errors {
    const err: Errors = {};
    const b = barcode.trim();
    if (b && existing.some((p) => p.barcode === b))
      err.barcode = "This barcode already belongs to another product.";
    if (!name.trim()) err.name = "Name is required.";
    if (!(parseFloat(price) > 0)) err.price = "Enter a price greater than 0.";
    if (costPrice !== "" && !(parseFloat(costPrice) >= 0))
      err.costPrice = "Cost price cannot be negative.";
    const st = Number(stock);
    if (stock === "" || !Number.isInteger(st) || st < 0)
      err.stock = "Enter a whole number, 0 or more.";
    const low = Number(lowStockAt);
    if (lowStockAt === "" || !Number.isInteger(low) || low < 0)
      err.lowStockAt = "Enter a whole number, 0 or more.";
    return err;
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (saving) return;
    const err = validate();
    setErrors(err);
    setFormError("");
    if (Object.keys(err).length > 0) return;

    setSaving(true);
    const message = await onSave({
      barcode: barcode.trim(),
      name: name.trim(),
      categoryId,
      price: parseFloat(price),
      costPrice: costPrice === "" ? 0 : parseFloat(costPrice),
      stock: Number(stock),
      lowStockAt: Number(lowStockAt),
    });
    setSaving(false);
    if (message) setFormError(message);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-product-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form
        onSubmit={submit}
        noValidate
        className="max-h-full w-full max-w-lg space-y-4 overflow-y-auto rounded-xl bg-[#fcf6f2] p-6 text-[#7d0e41] shadow-lg"
      >
        <h2 id="add-product-title" className="text-xl font-bold">
          Add product
        </h2>

        <Field
          id="barcode"
          label="Barcode (scan or type)"
          hint="Leave empty if the item has no barcode. A code is made for it."
          error={errors.barcode}
        >
          <input
            id="barcode"
            ref={barcodeRef}
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            onKeyDown={onBarcodeKey}
            placeholder="Scan the package"
            inputMode="numeric"
            aria-invalid={!!errors.barcode}
            aria-describedby={errors.barcode ? "barcode-error" : undefined}
            className={fieldClass}
          />
        </Field>

        <Field id="name" label="Name" error={errors.name}>
          <input
            id="name"
            ref={nameRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Basmati rice 5kg"
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "name-error" : undefined}
            className={fieldClass}
          />
        </Field>

        <Field
          id="category"
          label="Category"
          hint={
            categories.length === 0
              ? "No categories yet. Add some on the Categories page."
              : undefined
          }
        >
          <select
            id="category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className={fieldClass}
          >
            <option value="">No category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="price" label="Selling price (Rs)" error={errors.price}>
            <input
              id="price"
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              aria-invalid={!!errors.price}
              aria-describedby={errors.price ? "price-error" : undefined}
              className={fieldClass}
            />
          </Field>
          <Field
            id="costPrice"
            label="Cost price (Rs)"
            hint="What you pay the supplier."
            error={errors.costPrice}
          >
            <input
              id="costPrice"
              type="number"
              min="0"
              step="0.01"
              value={costPrice}
              onChange={(e) => setCostPrice(e.target.value)}
              aria-invalid={!!errors.costPrice}
              aria-describedby={errors.costPrice ? "costPrice-error" : undefined}
              className={fieldClass}
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="stock" label="Stock" error={errors.stock}>
            <input
              id="stock"
              type="number"
              min="0"
              step="1"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              aria-invalid={!!errors.stock}
              aria-describedby={errors.stock ? "stock-error" : undefined}
              className={fieldClass}
            />
          </Field>
          <Field
            id="lowStockAt"
            label="Low-stock alert at"
            hint="Flag when stock is this or less."
            error={errors.lowStockAt}
          >
            <input
              id="lowStockAt"
              type="number"
              min="0"
              step="1"
              value={lowStockAt}
              onChange={(e) => setLowStockAt(e.target.value)}
              aria-invalid={!!errors.lowStockAt}
              aria-describedby={errors.lowStockAt ? "lowStockAt-error" : undefined}
              className={fieldClass}
            />
          </Field>
        </div>

        {formError && (
          <p role="alert" className="text-sm font-medium text-red-700">
            {formError}
          </p>
        )}

        <div className="flex justify-end gap-3 pt-2">
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
            {saving ? "Saving..." : "Save product"}
          </button>
        </div>
      </form>
    </div>
  );
}