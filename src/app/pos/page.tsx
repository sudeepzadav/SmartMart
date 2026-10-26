"use client";
import { useState } from "react";
import Link from "next/link";

type Product = { sku: string; name: string; price: number };
type CartLine = Product & { qty: number };

// Sample data. Replace with products fetched from your database.
const products: Product[] = [
  { sku: "P001", name: "Basmati rice 5kg", price: 950 },
  { sku: "P002", name: "Dairy milk 1L", price: 120 },
  { sku: "P003", name: "Instant noodles", price: 30 },
  { sku: "P004", name: "Tea 250g", price: 210 },
];

export default function PosPage() {
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);

  const shown = products.filter(
    (p) => p.name.toLowerCase().includes(query.toLowerCase()) || p.sku === query
  );
  const total = cart.reduce((s, l) => s + l.price * l.qty, 0);

  function add(p: Product) {
    setCart((c) => {
      const found = c.find((l) => l.sku === p.sku);
      return found
        ? c.map((l) => (l.sku === p.sku ? { ...l, qty: l.qty + 1 } : l))
        : [...c, { ...p, qty: 1 }];
    });
  }
  function remove(sku: string) {
    setCart((c) => c.filter((l) => l.sku !== sku));
  }
  // Barcode scanners type the code and press Enter, so match by SKU here.
  function onEnter(e: React.KeyboardEvent) {
    if (e.key !== "Enter") return;
    const p = products.find((x) => x.sku === query);
    if (p) { add(p); setQuery(""); }
  }

  return (
    <div className="flex h-screen bg-[#fcf6f2]">
      <section className="flex-1 overflow-y-auto p-6">
        <div className="mb-5 flex items-center gap-4">
          <Link
            href="/dashboard"
            className="rounded-md border border-[#aa5e78] bg-white px-3 py-2 text-sm font-medium text-[#7d0e41] hover:border-[#7d0e41] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7d0e41]"
          >
            Back to dashboard
          </Link>
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onEnter}
            placeholder="Search or scan a barcode"
            className="flex-1 rounded-md border border-[#d49b9a] bg-white px-3 py-2 text-[#7d0e41] placeholder:text-[#aa5e78]/70 focus:border-[#7d0e41] focus:outline-2 focus:outline-offset-1 focus:outline-[#aa5e78]"
          />
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
          {shown.map((p) => (
            <button
              key={p.sku}
              onClick={() => add(p)}
              className="rounded-xl border border-[#d49b9a] bg-white p-4 text-left shadow-sm hover:border-[#7d0e41] hover:bg-[#f4d9cd] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7d0e41]"
            >
              <div className="font-semibold text-[#7d0e41]">{p.name}</div>
              <div className="mt-1 text-sm text-[#6b4455]">Rs {p.price}</div>
            </button>
          ))}
          {shown.length === 0 && (
            <p className="col-span-full text-sm text-[#6b4455]">No products match your search.</p>
          )}
        </div>
      </section>

      <aside className="flex w-96 flex-col bg-[#7d0e41] p-6">
        <h2 className="mb-4 text-lg font-bold text-[#f4d9cd]">Current sale</h2>

        <ul className="flex-1 space-y-3 overflow-y-auto">
          {cart.length === 0 && (
            <li className="text-sm text-[#d49b9a]">Tap a product or scan a barcode to start.</li>
          )}
          {cart.map((l) => (
            <li key={l.sku} className="flex items-center justify-between text-sm text-white">
              <span>{l.name} x {l.qty}</span>
              <span className="flex items-center gap-3">
                Rs {l.price * l.qty}
                <button
                  onClick={() => remove(l.sku)}
                  className="text-[#f4d9cd] underline hover:text-white"
                >
                  Remove
                </button>
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-4 flex justify-between border-t border-[#aa5e78] pt-4 text-lg font-bold text-white">
          <span>Total</span>
          <span>Rs {total}</span>
        </div>

        <button
          disabled={cart.length === 0}
          onClick={() => { /* TODO: save sale via API */ setCart([]); }}
          className="mt-4 rounded-md bg-[#f4d9cd] py-3 font-semibold text-[#7d0e41] hover:bg-[#d49b9a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f4d9cd] disabled:opacity-40 disabled:hover:bg-[#f4d9cd]"
        >
          Complete sale
        </button>
      </aside>
    </div>
  );
}