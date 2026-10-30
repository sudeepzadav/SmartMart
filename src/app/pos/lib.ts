import type { CartLine, DiscountType, Totals } from "./types";

// ---- Store settings (edit these) ----
export const STORE = {
  name: "My Mart",
  address: "Kathmandu, Nepal",
  phone: "01-0000000",
  vatNo: "PAN/VAT: 000000000",
};

// Set to 0 if prices already include VAT or you don't charge it.
export const VAT_RATE = 0.13;

export const round2 = (n: number) => Math.round(n * 100) / 100;

export const fmt = (n: number) =>
  "Rs " + n.toLocaleString("en-IN", { maximumFractionDigits: 2 });

// Pure function, easy to unit test.
export function calcTotals(
  cart: CartLine[],
  discountType: DiscountType,
  discountValue: string
): Totals {
  const subtotal = cart.reduce((s, l) => s + l.price * l.qty, 0);
  const dv = Math.max(0, parseFloat(discountValue) || 0);
  const discount = round2(
    discountType === "percent"
      ? (subtotal * Math.min(dv, 100)) / 100
      : Math.min(dv, subtotal)
  );
  const taxable = subtotal - discount;
  const vat = round2(taxable * VAT_RATE);
  return { subtotal, discount, vat, total: round2(taxable + vat) };
}