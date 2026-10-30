"use client";
import type { RefObject, KeyboardEvent } from "react";
import Link from "next/link";
import type { Product, ScanStatus } from "@/app/pos/types";

type Props = {
  products: Product[];
  query: string;
  onQueryChange: (value: string) => void;
  onEnter: (e: KeyboardEvent) => void;
  inputRef: RefObject<HTMLInputElement | null>;
  status: ScanStatus;
  onAdd: (p: Product) => void;
};

export default function ProductGrid({
  products,
  query,
  onQueryChange,
  onEnter,
  inputRef,
  status,
  onAdd,
}: Props) {
  return (
    <section className="flex-1 overflow-y-auto p-6">
      <div className="mb-2 flex items-center gap-4">
        <Link
          href="/dashboard"
          className="rounded-md border border-[#aa5e78] bg-white px-3 py-2 text-sm font-medium text-[#7d0e41] hover:border-[#7d0e41] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7d0e41]"
        >
          Back to dashboard
        </Link>
        <input
          ref={inputRef}
          autoFocus
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={onEnter}
          placeholder="Search or scan a barcode"
          className="flex-1 rounded-md border border-[#d49b9a] bg-white px-3 py-2 text-[#7d0e41] placeholder:text-[#aa5e78]/70 focus:border-[#7d0e41] focus:outline-2 focus:outline-offset-1 focus:outline-[#aa5e78]"
        />
      </div>

      <p
        role="status"
        aria-live="polite"
        className={`mb-4 h-5 text-sm ${
          status?.ok === false ? "font-medium text-red-700" : "text-[#6b4455]"
        }`}
      >
        {status?.text}
      </p>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
        {products.map((p) => (
          <button
            key={p.sku}
            onClick={() => onAdd(p)}
            className="rounded-xl border border-[#d49b9a] bg-white p-4 text-left shadow-sm hover:border-[#7d0e41] hover:bg-[#f4d9cd] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7d0e41]"
          >
            <div className="font-semibold text-[#7d0e41]">{p.name}</div>
            <div className="mt-1 text-sm text-[#6b4455]">Rs {p.price}</div>
          </button>
        ))}
        {products.length === 0 && (
          <p className="col-span-full text-sm text-[#6b4455]">
            No products match your search.
          </p>
        )}
      </div>
    </section>
  );
}