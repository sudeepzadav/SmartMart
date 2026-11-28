import type { CartLine, DiscountType, Totals } from "./types";

// Fallback store details, only used if nothing else is available.
// The real details now come from the Settings page (see src/lib/settings.ts).
export const STORE = {
  name: "My Mart",
  address: "Kathmandu, Nepal",
  phone: "01-0000000",
  vatNo: "PAN/VAT: 000000000",
};

// Fallback VAT rate (a fraction: 0.13 is 13%). The real rate now comes from
// the Settings page and is passed to calcTotals below.
export const VAT_RATE = 0.13;

export const round2 = (n: number) => Math.round(n * 100) / 100;

export const fmt = (n: number) =>
  "Rs " + n.toLocaleString("en-IN", { maximumFractionDigits: 2 });

// Pure function, easy to unit test.
export function calcTotals(
  cart: CartLine[],
  discountType: DiscountType,
  discountValue: string,
  vatRate: number = VAT_RATE // a fraction, for example 0.13 for 13%
): Totals {
  const subtotal = cart.reduce((s, l) => s + l.price * l.qty, 0);
  const dv = Math.max(0, parseFloat(discountValue) || 0);
  const discount = round2(
    discountType === "percent"
      ? (subtotal * Math.min(dv, 100)) / 100
      : Math.min(dv, subtotal)
  );
  const taxable = subtotal - discount;
  const vat = round2(taxable * vatRate);
  return { subtotal, discount, vat, total: round2(taxable + vat) };
}

export const formatInvoiceNo = (n: number) =>
  `INV-${String(n).padStart(5, "0")}`;