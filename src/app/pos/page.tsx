"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";

import ProductGrid from "@/components/ProductGrid";
import CartPanel from "@/components/CartPanel";
import BillReceipt from "@/components/BillReceipt";

import { calcTotals, round2 } from "./lib";
import { DEFAULT_SETTINGS } from "@/lib/settings-types";
import type { StoreSettings } from "@/lib/settings-types";

import type {
  Bill,
  CartLine,
  DiscountType,
  PayMethod,
  Product,
  ScanStatus,
} from "./types";

export default function PosPage() {
  // Store name, address, VAT rate... saved on the Settings page.
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [status, setStatus] = useState<ScanStatus>(null);

  const [customer, setCustomer] = useState("");
  const [discountType, setDiscountType] =
    useState<DiscountType>("amount");
  const [discountValue, setDiscountValue] = useState("");

  const [method, setMethod] = useState<PayMethod>("Cash");
  const [tendered, setTendered] = useState("");

  const [bill, setBill] = useState<Bill | null>(null);
  const [billCounter, setBillCounter] = useState(1);

  const [saving, setSaving] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const [height, setHeight] = useState("100dvh");

  // Fit the POS into the available screen space.
  useEffect(() => {
    function fit() {
      const el = rootRef.current;
      if (!el) return;

      const r = el.getBoundingClientRect();
      const top = r.top + window.scrollY;

      const below =
        document.documentElement.scrollHeight -
        (r.bottom + window.scrollY);

      setHeight(
        `${Math.max(320, window.innerHeight - top - below)}px`
      );
    }

    fit();

    window.addEventListener("resize", fit);
    window.addEventListener("load", fit);

    return () => {
      window.removeEventListener("resize", fit);
      window.removeEventListener("load", fit);
    };
  }, []);

  // Load the store settings (name, address, VAT rate).
  useEffect(() => {
    let cancelled = false;

    async function loadSettings() {
      try {
        const res = await fetch("/api/settings", {
          cache: "no-store",
        });

        if (!res.ok) return;

        const data: StoreSettings = await res.json();

        if (!cancelled) {
          setSettings(data);
        }
      } catch {
        // Keep the defaults if the settings cannot be loaded.
      }
    }

    loadSettings();

    return () => {
      cancelled = true;
    };
  }, []);

  // Load products from the database.
  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      try {
        const res = await fetch("/api/products", {
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error("Could not load products");
        }

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

        if (!cancelled) {
          setProducts(list);
          setLoadError("");
        }
      } catch {
        if (!cancelled) {
          setLoadError(
            "Could not load products. Check the connection and refresh."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadProducts();

    return () => {
      cancelled = true;
    };
  }, []);

  // Refresh product stock after a completed sale.
  async function refreshProducts() {
    try {
      const res = await fetch("/api/products", {
        cache: "no-store",
      });

      if (!res.ok) return;

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

      setProducts(list);
    } catch (error) {
      console.error("Could not refresh product stock:", error);
    }
  }

  // Barcode scanner keyboard listener.
  useEffect(() => {
    if (bill) return;

    function onKey(e: globalThis.KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;

      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT"
      ) {
        return;
      }

      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (e.key.length === 1) {
        inputRef.current?.focus();
      }
    }

    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("keydown", onKey);
    };
  }, [bill]);

  // Search products.
  const q = query.trim().toLowerCase();

  const shown = products.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.barcode === query.trim()
  );

  // Calculate cart totals with the VAT rate from Settings.
  const totals = useMemo(
    () =>
      calcTotals(
        cart,
        discountType,
        discountValue,
        settings.vatRate / 100
      ),
    [cart, discountType, discountValue, settings.vatRate]
  );

  // Cash calculation.
  const tenderedNum =
    tendered === "" ? null : parseFloat(tendered) || 0;

  const cashShort =
    method === "Cash" &&
    tenderedNum !== null &&
    tenderedNum < totals.total;

  const change =
    method === "Cash" && tenderedNum !== null
      ? Math.max(0, round2(tenderedNum - totals.total))
      : 0;

  // Add product to cart.
  function add(p: Product) {
    if (p.stock <= 0) {
      setStatus({
        ok: false,
        text: `${p.name} is out of stock`,
      });
      return;
    }

    setCart((c) => {
      const found = c.find((l) => l.id === p.id);

      if (found) {
        if (found.qty >= p.stock) {
          setStatus({
            ok: false,
            text: `Only ${p.stock} units available for ${p.name}`,
          });
          return c;
        }

        return c.map((l) =>
          l.id === p.id
            ? { ...l, qty: l.qty + 1 }
            : l
        );
      }

      return [...c, { ...p, qty: 1 }];
    });

    setStatus({
      ok: true,
      text: `Added ${p.name}`,
    });
  }

  // Change cart quantity.
  function changeQty(id: string, delta: number) {
    setCart((c) =>
      c
        .map((l) => {
          if (l.id !== id) return l;

          const product = products.find((p) => p.id === id);
          const newQty = l.qty + delta;

          if (newQty > (product?.stock ?? 0)) {
            setStatus({
              ok: false,
              text: `Only ${product?.stock ?? 0} units available`,
            });
            return l;
          }

          return { ...l, qty: newQty };
        })
        .filter((l) => l.qty > 0)
    );
  }

  function remove(id: string) {
    setCart((c) => c.filter((l) => l.id !== id));
  }

  function onEnter(e: KeyboardEvent) {
    if (e.key !== "Enter") return;

    const code = query.trim();

    if (!code) return;

    const exact = products.find(
      (x) => x.barcode === code
    );

    const match =
      exact ?? (shown.length === 1 ? shown[0] : undefined);

    if (match) {
      add(match);
    } else {
      setStatus({
        ok: false,
        text: `No product found for "${code}"`,
      });
    }

    setQuery("");
  }

  async function completeSale() {
    if (cart.length === 0 || cashShort || saving) {
      return;
    }

    setSaving(true);
    setStatus(null);

    try {
      const response = await fetch("/api/sales", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: cart.map((item) => ({
            productId: item.id,
            quantity: item.qty,
          })),

          paymentMethod:
            method === "Cash"
              ? "CASH"
              : method === "Card"
                ? "CARD"
                : "QR",

          discountType,
          discountValue,
          customerName: customer.trim(),

          tendered:
            method === "Cash" ? tenderedNum : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Could not complete sale"
        );
      }

      const savedSale = data.sale;

      if (!savedSale) {
        throw new Error(
          "The server did not return the saved sale"
        );
      }

      const newBill: Bill = {
        billNo: `INV-${String(
          savedSale.receiptNo
        ).padStart(5, "0")}`,

        date: savedSale.createdAt
          ? new Date(savedSale.createdAt).toLocaleString("en-GB")
          : new Date().toLocaleString("en-GB"),

        customer: customer.trim(),

        lines: cart,

        // Use the amounts the server saved, so the bill always matches
        // the database. Fall back to the on-screen totals if missing.
        totals: {
          subtotal: savedSale.subtotal ?? totals.subtotal,
          discount: savedSale.discount ?? totals.discount,
          vat: savedSale.vat ?? totals.vat,
          total: savedSale.total ?? totals.total,
        },

        method,

        tendered:
          method === "Cash" ? tenderedNum : null,

        change: savedSale.change,
      };

      setBill(newBill);
      setBillCounter((n) => n + 1);

      await refreshProducts();
    } catch (error) {
      console.error("Sale error:", error);

      const message =
        error instanceof Error
          ? error.message
          : "Something went wrong while completing the sale";

      setStatus({
        ok: false,
        text: message,
      });
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

    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
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
          saving={saving}
          vatPercent={settings.vatRate}
        />
      </div>

      {bill && (
        <BillReceipt
          bill={bill}
          store={settings}
          onNewSale={startNewSale}
        />
      )}
    </>
  );
}