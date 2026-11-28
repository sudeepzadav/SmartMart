import { db } from "@/lib/db";

// ---------- Helpers ----------
const OFFSET = (5 * 60 + 45) * 60 * 1000; // Nepal is UTC+5:45 (no daylight saving)
const DAY = 24 * 60 * 60 * 1000;
const r2 = (n: number) => Math.round(n * 100) / 100;

// The calendar date (YYYY-MM-DD) of a moment, in Nepal time.
const nepalDate = (d: Date) => new Date(d.getTime() + OFFSET).toISOString().slice(0, 10);

const validDate = (s?: string): s is string =>
  !!s && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(new Date(`${s}T00:00:00Z`).getTime());

// Turns the ?from= and ?to= text into a safe range. Default: the last 30 days.
function resolveRange(fromParam?: string, toParam?: string) {
  const to = validDate(toParam) ? toParam : nepalDate(new Date());
  const toMs = new Date(`${to}T00:00:00Z`).getTime();
  let from = validDate(fromParam)
    ? fromParam
    : new Date(toMs - 29 * DAY).toISOString().slice(0, 10);
  let fromMs = new Date(`${from}T00:00:00Z`).getTime();
  let toFinal = to;
  let toMsFinal = toMs;
  if (fromMs > toMs) {
    [from, toFinal] = [to, from];
    [fromMs, toMsFinal] = [toMs, fromMs];
  }
  if (toMsFinal - fromMs > 365 * DAY) {
    // keep the report fast: at most one year at a time
    fromMs = toMsFinal - 365 * DAY;
    from = new Date(fromMs).toISOString().slice(0, 10);
  }
  return {
    from,
    to: toFinal,
    start: new Date(fromMs - OFFSET), // start of the first day, Nepal time
    end: new Date(toMsFinal + DAY - OFFSET), // start of the day after the last day
  };
}

// ---------- Report list ----------
export const REPORTS = [
  { slug: "daily-sales", title: "Daily sales", desc: "Totals by day and payment type.", needsRange: true },
  { slug: "profit-loss", title: "Profit and loss", desc: "Sales minus the cost of what you sold and your expenses.", needsRange: true },
  { slug: "stock-valuation", title: "Stock valuation", desc: "What your current stock is worth.", needsRange: false },
  { slug: "top-products", title: "Top products", desc: "Best sellers by units and revenue.", needsRange: true },
] as const;

export type SortKey = "revenue" | "units";

export type Report = {
  slug: string;
  title: string;
  desc: string;
  needsRange: boolean;
  from: string;
  to: string;
  sort: SortKey;
  query: string; // the filters as a query string, reused for the CSV link
  columns: string[];
  rows: (string | number)[][];
  notes: string[];
};

type Body = Pick<Report, "columns" | "rows" | "notes">;

// ---------- Daily sales ----------
async function dailySales(start: Date, end: Date): Promise<Body> {
  const sales = await db.sale.findMany({
    where: { createdAt: { gte: start, lt: end } },
    select: { createdAt: true, total: true, discount: true, vat: true, paymentMethod: true },
  });

  type Day = {
    bills: number; CASH: number; CARD: number; QR: number; CREDIT: number;
    discount: number; vat: number; total: number;
  };
  const empty = (): Day => ({ bills: 0, CASH: 0, CARD: 0, QR: 0, CREDIT: 0, discount: 0, vat: 0, total: 0 });
  const days = new Map<string, Day>();
  const all = empty();

  for (const s of sales) {
    const key = nepalDate(s.createdAt);
    const d = days.get(key) ?? empty();
    days.set(key, d);
    for (const t of [d, all]) {
      t.bills += 1;
      t[s.paymentMethod] += s.total;
      t.discount += s.discount;
      t.vat += s.vat;
      t.total += s.total;
    }
  }

  const line = (label: string, d: Day): (string | number)[] => [
    label, d.bills, r2(d.CASH), r2(d.CARD), r2(d.QR), r2(d.CREDIT), r2(d.discount), r2(d.vat), r2(d.total),
  ];
  const rows = Array.from(days.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([key, d]) => line(key, d));
  if (rows.length > 0) rows.push(line("Total", all));

  return {
    columns: ["Date", "Bills", "Cash", "Card", "QR", "Credit", "Discount", "VAT", "Total"],
    rows,
    notes: ["Payment columns and Total include VAT. Days are in Nepal time."],
  };
}

// ---------- Profit and loss ----------
async function profitLoss(start: Date, end: Date): Promise<Body> {
  const [sales, expenses, purchases] = await Promise.all([
    db.sale.findMany({
      where: { createdAt: { gte: start, lt: end } },
      select: { subtotal: true, discount: true, vat: true, items: true },
    }),
    db.expense.aggregate({
      where: { date: { gte: start, lt: end } },
      _sum: { amount: true },
    }),
    db.purchase.aggregate({
      where: { status: "Received", receivedAt: { gte: start, lt: end } },
      _sum: { total: true },
    }),
  ]);

  let netSales = 0;
  let vat = 0;
  let cogs = 0;
  let missingCost = 0;
  for (const s of sales) {
    netSales += s.subtotal - s.discount;
    vat += s.vat;
    for (const it of s.items) {
      cogs += (it.costPrice ?? 0) * it.quantity;
      if (!it.costPrice) missingCost += 1;
    }
  }
  const expenseTotal = expenses._sum.amount ?? 0;
  const gross = netSales - cogs;
  const net = gross - expenseTotal;

  const notes = [
    "Cost of goods sold uses the cost price saved on each product when it was sold.",
    "VAT and stock purchases are shown for information only. They are not part of profit.",
  ];
  if (missingCost > 0) {
    notes.push(
      `${missingCost} sold item line(s) had no cost price, so profit may look higher than it really is. Set cost prices on the Products page.`
    );
  }

  return {
    columns: ["Item", "Amount (Rs)"],
    rows: [
      ["Net sales (after discounts, before VAT)", r2(netSales)],
      ["Cost of goods sold", r2(cogs)],
      ["Gross profit", r2(gross)],
      ["Expenses", r2(expenseTotal)],
      ["Net profit", r2(net)],
      ["VAT collected (information only)", r2(vat)],
      ["Stock purchased and received (information only)", r2(purchases._sum.total ?? 0)],
    ],
    notes,
  };
}

// ---------- Stock valuation ----------
async function stockValuation(): Promise<Body> {
  const products = await db.product.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
    select: { name: true, stock: true, costPrice: true, price: true },
  });

  let costTotal = 0;
  let retailTotal = 0;
  let noCost = 0;
  const rows: (string | number)[][] = products.map((p) => {
    const atCost = p.stock * p.costPrice;
    const atRetail = p.stock * p.price;
    costTotal += atCost;
    retailTotal += atRetail;
    if (!p.costPrice) noCost += 1;
    return [p.name, p.stock, p.costPrice, p.price, r2(atCost), r2(atRetail)];
  });
  if (rows.length > 0) rows.push(["Total", "", "", "", r2(costTotal), r2(retailTotal)]);

  const notes = ["Value at cost is stock times cost price. Value at selling price is stock times selling price."];
  if (noCost > 0) {
    notes.push(`${noCost} product(s) have no cost price, so their value at cost shows as 0.`);
  }
  return {
    columns: ["Product", "In stock", "Cost price", "Selling price", "Value at cost", "Value at selling price"],
    rows,
    notes,
  };
}

// ---------- Top products ----------
async function topProducts(start: Date, end: Date, sort: SortKey): Promise<Body> {
  const sales = await db.sale.findMany({
    where: { createdAt: { gte: start, lt: end } },
    select: { items: true },
  });

  const byProduct = new Map<string, { name: string; units: number; revenue: number }>();
  for (const s of sales) {
    for (const it of s.items) {
      const row = byProduct.get(it.productId) ?? { name: it.name, units: 0, revenue: 0 };
      row.units += it.quantity;
      row.revenue += it.price * it.quantity;
      byProduct.set(it.productId, row);
    }
  }

  const rows = Array.from(byProduct.values())
    .sort((a, b) => b[sort] - a[sort] || a.name.localeCompare(b.name))
    .slice(0, 20)
    .map((p, i) => [i + 1, p.name, p.units, r2(p.revenue)]);

  return {
    columns: ["#", "Product", "Units sold", "Revenue (Rs)"],
    rows,
    notes: ["Shows the top 20. Revenue is price times quantity, before bill discounts and VAT."],
  };
}

// ---------- Public entry ----------
export async function buildReport(
  slug: string,
  params: { from?: string; to?: string; sort?: string }
): Promise<Report | null> {
  const meta = REPORTS.find((r) => r.slug === slug);
  if (!meta) return null;

  const { from, to, start, end } = resolveRange(params.from, params.to);
  const sort: SortKey = params.sort === "units" ? "units" : "revenue";

  let body: Body;
  if (slug === "daily-sales") body = await dailySales(start, end);
  else if (slug === "profit-loss") body = await profitLoss(start, end);
  else if (slug === "stock-valuation") body = await stockValuation();
  else body = await topProducts(start, end, sort);

  const q = new URLSearchParams();
  if (meta.needsRange) {
    q.set("from", from);
    q.set("to", to);
  }
  if (slug === "top-products") q.set("sort", sort);

  return { ...meta, from, to, sort, query: q.toString(), ...body };
}

// ---------- CSV ----------
function csvCell(v: string | number) {
  if (typeof v === "number") return String(v);
  let s = v;
  // A cell starting with = + - @ can run as a formula in Excel, so neutralise it.
  if (/^[=+\-@]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(columns: string[], rows: (string | number)[][]) {
  const lines = [columns, ...rows].map((r) => r.map(csvCell).join(","));
  return "\uFEFF" + lines.join("\r\n") + "\r\n"; // BOM so Excel reads it correctly
}