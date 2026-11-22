import { connection } from "next/server";
import PageHeader from "@/components/PageHeader";
import DataTable from "@/components/DataTable";
import { db } from "@/lib/db";
import { formatInvoiceNo } from "@/app/pos/lib";

// "Today" and "this month" depend on the shop's time zone, not the server's.
// Move these into a Settings collection later.
const SHOP_TZ = "Asia/Kathmandu";
const SHOP_OFFSET = "+05:45"; // Nepal has no daylight saving

const money = (n: number) =>
  `Rs ${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

// YYYY-MM-DD for the shop's current date
const shopDate = (date: Date) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: SHOP_TZ }).format(date);

const startOfToday = () =>
  new Date(`${shopDate(new Date())}T00:00:00${SHOP_OFFSET}`);

const startOfMonth = () =>
  new Date(`${shopDate(new Date()).slice(0, 7)}-01T00:00:00${SHOP_OFFSET}`);

const formatTime = (date: Date) =>
  new Intl.DateTimeFormat("en-GB", {
    timeZone: SHOP_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);

export default async function Page() {
  await connection(); // always read live numbers, never a build-time copy

  const [todaySales, monthExpenses, products, recentSales] = await Promise.all([
    db.sale.aggregate({
      where: { createdAt: { gte: startOfToday() } },
      _sum: { total: true, vat: true },
      _count: true,
    }),
    db.expense.aggregate({
      where: { date: { gte: startOfMonth() } },
      _sum: { amount: true },
    }),
    db.product.findMany({
      where: { active: true },
      select: { stock: true, lowStockAt: true },
    }),
    db.sale.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { receiptNo: true, createdAt: true, total: true },
    }),
  ]);

  const lowStockCount = products.filter((p) => p.stock <= p.lowStockAt).length;

  const stats = [
    // Sales without VAT, since VAT is collected for the government
    [
      "Today's sales",
      money((todaySales._sum.total ?? 0) - (todaySales._sum.vat ?? 0)),
    ],
    ["Orders today", String(todaySales._count)],
    ["Low-stock items", String(lowStockCount)],
    ["Expenses this month", money(monthExpenses._sum.amount ?? 0)],
  ];

  return (
    <div className="flex h-full flex-col overflow-hidden text-[#7d0e41]">
      <PageHeader
        title="Dashboard"
        subtitle="How the store is doing today."
      />

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map(([label, value], i) => (
          <div
            key={label}
            className={
              i === 0
                ? "rounded-xl bg-[#7d0e41] p-4 shadow-sm"
                : "rounded-xl border border-[#d49b9a] border-t-4 border-t-[#aa5e78] bg-white p-4 shadow-sm"
            }
          >
            <div
              className={
                i === 0 ? "text-sm text-[#f4d9cd]" : "text-sm text-[#6b4455]"
              }
            >
              {label}
            </div>

            <div
              className={`mt-1 text-xl font-bold ${
                i === 0 ? "text-white" : "text-[#7d0e41]"
              }`}
            >
              {value}
            </div>
          </div>
        ))}
      </div>

      <h2 className="mb-3 text-lg font-semibold">Recent sales</h2>

      <div className="min-h-0 flex-1 overflow-auto rounded-lg bg-white text-[#7d0e41]">
        {recentSales.length === 0 ? (
          <p className="p-6 text-sm text-[#6b4455]">
            No sales yet. Completed sales from the counter will show up here.
          </p>
        ) : (
          <DataTable
            columns={["Receipt", "Time", "Total (Rs)"]}
            rows={recentSales.map((sale) => [
              formatInvoiceNo(sale.receiptNo),
              formatTime(sale.createdAt),
              sale.total,
            ])}
          />
        )}
      </div>
    </div>
  );
}