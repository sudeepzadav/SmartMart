export type Product = { sku: string; barcode: string; name: string; price: number };
export type CartLine = Product & { qty: number };

export type PayMethod = "Cash" | "Card" | "QR";
export type DiscountType = "amount" | "percent";

export type Totals = {
  subtotal: number;
  discount: number;
  vat: number;
  total: number;
};

export type Bill = {
  billNo: string;
  date: string;
  customer: string;
  lines: CartLine[];
  totals: Totals;
  method: PayMethod;
  tendered: number | null;
  change: number;
};

export type ScanStatus = { ok: boolean; text: string } | null;