"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import ProductGrid from "@/components/ProductGrid";
import CartPanel from "@/components/CartPanel";
import BillReceipt from "@/components/BillReceipt";
import { calcTotals, round2 } from "./lib";
import type {
  Bill,
  CartLine,
  DiscountType,
  PayMethod,
  Product,
  ScanStatus,
} from "./types";

export default function PosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [status, setStatus] = useState<ScanStatus>(null);

  const [customer, setCustomer] = useState("");
  const [discountType, setDiscountType] = useState<DiscountType>("amount");
  const [discountValue, setDiscountValue] = useState("");
  const [method, setMethod] = useState<PayMethod>("Cash");
  const [tendered, setTendered] = useState("");

  const [bill, setBill] = useState<Bill | null>(null);
  const [billCounter, setBillCounter] = useState(1);

  // The ref lives here so the global scanner listener below can use it.
  const inputRef = useRef<HTMLInputElement>(null);

  // Fit the POS exactly into the space left under the navbar (and above the footer),
  // so the page itself never scrolls. Only the product list and the cart scroll.
  const rootRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState("100dvh");
  useEffect(() => {
    function fit() {
      const el = rootRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const top = r.top + window.scrollY;
      const below =
        document.documentElement.scrollHeight - (r.bottom + window.scrollY);
      setHeight(`${Math.max(320, window.innerHeight - top - below)}px`);
    }
    fit();
    window.addEventListener("resize", fit);
    window.addEventListener("load", fit);
    return () => {
      window.removeEventListener("resize", fit);
      window.removeEventListener("load", fit);
    };
  }, []);

  // Load the products saved in the database.
  // /api/products returns { products: [...], categories: [...] }.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/products");
        if (!res.ok) throw new Error("load failed");
        const data = await res.json();
        const list: Product[] = (data.products ?? []).map(
          (p: Product & Record<string, unknown>) => ({
            id: p.id,
            barcode: p.barcode,
            name: p.name,
            price: p.price,
            stock: p.stock,
          })
        );
        if (!cancelled) setProducts(list);
      } catch {
        if (!cancelled)
          setLoadError("Could not load products. Check the connection and refresh.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Barcode scanners act like a keyboard: they type the code very fast and press Enter.
  // If focus is not in a field (e.g. after clicking a button), send the keystrokes
  // to the search box so the scan is never lost.
  useEffect(() => {
    if (bill) return;
    function onKey(e: globalThis.KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key.length === 1) inputRef.current?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [bill]);

  const q = query.trim().toLowerCase();
  const shown = products.filter(
    (p) => p.name.toLowerCase().includes(q) || p.barcode === query.trim()
  );

  const totals = useMemo(
    () => calcTotals(cart, discountType, discountValue),
    [cart, discountType, discountValue]
  );

  const tenderedNum = tendered === "" ? null : parseFloat(tendered) || 0;
  const cashShort =
    method === "Cash" && tenderedNum !== null && tenderedNum < totals.total;
  const change =
    method === "Cash" && tenderedNum !== null
      ? Math.max(0, round2(tenderedNum - totals.total))
      : 0;

  // ---- Cart actions ----
  function add(p: Product) {
    setCart((c) => {
      const found = c.find((l) => l.id === p.id);
      return found
        ? c.map((l) => (l.id === p.id ? { ...l, qty: l.qty + 1 } : l))
        : [...c, { ...p, qty: 1 }];
    });
    setStatus({ ok: true, text: `Added ${p.name}` });
  }
  function changeQty(id: string, delta: number) {
    setCart((c) =>
      c
        .map((l) => (l.id === id ? { ...l, qty: l.qty + delta } : l))
        .filter((l) => l.qty > 0)
    );
  }
  function remove(id: string) {
    setCart((c) => c.filter((l) => l.id !== id));
  }

  // Scan / Enter: match the barcode exactly, else a single search result.
  function onEnter(e: KeyboardEvent) {
    if (e.key !== "Enter") return;
    const code = query.trim();
    if (!code) return;
    const exact = products.find((x) => x.barcode === code);
    const match = exact ?? (shown.length === 1 ? shown[0] : undefined);
    if (match) add(match);
    else setStatus({ ok: false, text: `No product found for "${code}"` });
    setQuery(""); // clear so the next scan starts fresh
  }

  // ---- Billing ----
  function completeSale() {
    if (cart.length === 0 || cashShort) return;
    const newBill: Bill = {
      billNo: `INV-${String(billCounter).padStart(5, "0")}`,
      date: new Date().toLocaleString("en-GB"),
      customer: customer.trim(),
      lines: cart,
      totals,
      method,
      tendered: method === "Cash" ? tenderedNum : null,
      change,
    };
    // TODO: save the sale via API and reduce the stock of the sold products.
    setBill(newBill);
    setBillCounter((n) => n + 1);
  }
  function startNewSale() {
    setBill(null);
    setCart([]);
    setCustomer("");
    setDiscountValue("");
    setDiscountType("amount");
    setMethod("Cash");
    setTendered("");
    setQuery("");
    setStatus(null);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  return (
    <>
      <div
        ref={rootRef}
        style={{ height }}
        className="flex overflow-hidden bg-[#fcf6f2] print:hidden"
      >
        <ProductGrid
          products={shown}
          query={query}
          onQueryChange={setQuery}
          onEnter={onEnter}
          inputRef={inputRef}
          status={status}
          loading={loading}
          loadError={loadError}
          onAdd={add}
        />
        <CartPanel
          cart={cart}
          totals={totals}
          customer={customer}
          onCustomerChange={setCustomer}
          discountType={discountType}
          onDiscountTypeChange={setDiscountType}
          discountValue={discountValue}
          onDiscountValueChange={setDiscountValue}
          method={method}
          onMethodChange={setMethod}
          tendered={tendered}
          onTenderedChange={setTendered}
          cashShort={cashShort}
          change={change}
          onChangeQty={changeQty}
          onRemove={remove}
          onComplete={completeSale}
        />
      </div>

      {bill && <BillReceipt bill={bill} onNewSale={startNewSale} />}
    </>
  );
}