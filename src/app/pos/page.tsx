"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import ProductGrid from "@/components/ProductGrid";
import CartPanel from "@/components/CartPanel";
import BillReceipt from "@/components/BillReceipt";
import { calcTotals, formatInvoiceNo, round2 } from "./lib";
import type {
  Bill,
  CartLine,
  DiscountType,
  PayMethod,
  Product,
  ScanStatus,
} from "./types";
import Footer from "@/components/Footer";

export default function PosPage() {
  const router = useRouter();

  // Products now come from the database (/api/products).
  // `sku` holds the product's database id, which is what the server needs.
  const [products, setProducts] = useState<Product[]>([]);

  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [status, setStatus] = useState<ScanStatus>(null);

  const [customer, setCustomer] = useState("");
  const [discountType, setDiscountType] = useState<DiscountType>("amount");
  const [discountValue, setDiscountValue] = useState("");
  const [method, setMethod] = useState<PayMethod>("Cash");
  const [tendered, setTendered] = useState("");

  const [bill, setBill] = useState<Bill | null>(null);
  const [saving, setSaving] = useState(false);

  // The ref lives here so the global scanner listener below can use it.
  const inputRef = useRef<HTMLInputElement>(null);

  const loadProducts = useCallback(async () => {
    try {
      const res = await fetch("/api/products", { cache: "no-store" });
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (!res.ok) throw new Error("Failed");
      const data: {
        id: string;
        name: string;
        barcode: string | null;
        price: number;
      }[] = await res.json();
      setProducts(
        data.map((p) => ({
          sku: p.id,
          barcode: p.barcode ?? "",
          name: p.name,
          price: p.price,
        }))
      );
    } catch {
      setStatus({
        ok: false,
        text: "Could not load products. Check the connection and refresh.",
      });
    }
  }, [router]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Fit the POS exactly into the space left under the navbar (and above any footer),
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

  const shown = products.filter(
    (p) =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.sku.toLowerCase() === query.toLowerCase() ||
      p.barcode === query
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
      const found = c.find((l) => l.sku === p.sku);
      return found
        ? c.map((l) => (l.sku === p.sku ? { ...l, qty: l.qty + 1 } : l))
        : [...c, { ...p, qty: 1 }];
    });
    setStatus({ ok: true, text: `Added ${p.name}` });
  }
  function changeQty(sku: string, delta: number) {
    setCart((c) =>
      c
        .map((l) => (l.sku === sku ? { ...l, qty: l.qty + delta } : l))
        .filter((l) => l.qty > 0)
    );
  }
  function remove(sku: string) {
    setCart((c) => c.filter((l) => l.sku !== sku));
  }

  // Scan / Enter: match barcode or SKU exactly, else a single search result.
  function onEnter(e: KeyboardEvent) {
    if (e.key !== "Enter") return;
    const code = query.trim();
    if (!code) return;
    const exact = products.find(
      (x) => x.barcode === code || x.sku.toLowerCase() === code.toLowerCase()
    );
    const match = exact ?? (shown.length === 1 ? shown[0] : undefined);
    if (match) add(match);
    else setStatus({ ok: false, text: `No product found for "${code}"` });
    setQuery(""); // clear so the next scan starts fresh
  }

  // ---- Billing ----
  // The sale is saved on the server first. The bill is shown only after the
  // server confirms it, using the totals the server calculated.
  async function completeSale() {
    if (cart.length === 0 || cashShort || saving) return;
    setSaving(true);

    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((l) => ({ productId: l.sku, quantity: l.qty })),
          paymentMethod: method.toUpperCase(),
          discountType,
          discountValue,
          customerName: customer.trim(),
          tendered: method === "Cash" ? tenderedNum : null,
        }),
      });
      const data = await res.json();

      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (!res.ok) {
        setStatus({ ok: false, text: data.error ?? "Could not save the sale" });
        if (res.status === 409) loadProducts(); // stock may have changed
        return;
      }

      const sale = data.sale as {
        receiptNo: number;
        createdAt: string;
        customerName: string | null;
        subtotal: number;
        discount: number;
        vat: number;
        total: number;
        amountPaid: number;
        change: number;
      };

      setBill({
        billNo: formatInvoiceNo(sale.receiptNo),
        date: new Date(sale.createdAt).toLocaleString("en-GB"),
        customer: sale.customerName ?? "",
        lines: cart,
        totals: {
          subtotal: sale.subtotal,
          discount: sale.discount,
          vat: sale.vat,
          total: sale.total,
        },
        method,
        tendered: method === "Cash" ? sale.amountPaid : null,
        change: sale.change,
      });
      loadProducts(); // refresh stock after the sale
    } catch {
      setStatus({ ok: false, text: "Network error. The sale was not saved." });
    } finally {
      setSaving(false);
    }
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