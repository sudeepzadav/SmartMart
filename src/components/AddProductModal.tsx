"use client";
import { useEffect, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent, ReactNode } from "react";

export type ProductRecord = {
  sku: string;
  barcode: string;
  name: string;
  category: string;
  price: number;
  stock: number;
};

type Props = {
  existing: ProductRecord[]; // used to block duplicate SKU / barcode
  onSave: (p: ProductRecord) => void;
  onClose: () => void;
};

type Errors = Partial<Record<keyof ProductRecord, string>>;

const fieldClass =
  "w-full rounded-md border border-[#d49b9a] bg-white px-3 py-2 text-[#7d0e41] placeholder:text-[#aa5e78]/70 focus:border-[#7d0e41] focus:outline-2 focus:outline-offset-1 focus:outline-[#aa5e78]";

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="mt-1 text-xs text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

export default function AddProductModal({ existing, onSave, onClose }: Props) {
  const [sku, setSku] = useState("");
  const [barcode, setBarcode] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [errors, setErrors] = useState<Errors>({});

  const skuRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  const categories = Array.from(
    new Set(existing.map((p) => p.category).filter(Boolean))
  );

  useEffect(() => {
    skuRef.current?.focus();
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
    const s = sku.trim();
    const b = barcode.trim();
    if (!s) err.sku = "SKU is required.";
    else if (existing.some((p) => p.sku.toLowerCase() === s.toLowerCase()))
      err.sku = "This SKU already exists.";
    if (b && existing.some((p) => p.barcode === b))
      err.barcode = "This barcode already belongs to another product.";
    if (!name.trim()) err.name = "Name is required.";
    const pr = parseFloat(price);
    if (!(pr > 0)) err.price = "Enter a price greater than 0.";
    const st = Number(stock);
    if (stock === "" || !Number.isInteger(st) || st < 0)
      err.stock = "Enter a whole number, 0 or more.";
    return err;
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    const err = validate();
    setErrors(err);
    if (Object.keys(err).length > 0) return;
    onSave({
      sku: sku.trim(),
      barcode: barcode.trim(),
      name: name.trim(),
      category: category.trim() || "Uncategorized",
      price: parseFloat(price),
      stock: Number(stock),
    });
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

        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="sku" label="SKU" error={errors.sku}>
            <input
              id="sku"
              ref={skuRef}
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="P005"
              aria-invalid={!!errors.sku}
              aria-describedby={errors.sku ? "sku-error" : undefined}
              className={fieldClass}
            />
          </Field>
          <Field id="barcode" label="Barcode (scan or type)" error={errors.barcode}>
            <input
              id="barcode"
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
        </div>

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

        <Field id="category" label="Category" error={errors.category}>
          <input
            id="category"
            list="category-list"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Grocery"
            className={fieldClass}
          />
          <datalist id="category-list">
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="price" label="Price (Rs)" error={errors.price}>
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
        </div>

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
            className="rounded-md bg-[#7d0e41] px-4 py-2 font-semibold text-white hover:bg-[#aa5e78] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7d0e41]"
          >
            Save product
          </button>
        </div>
      </form>
    </div>
  );
}