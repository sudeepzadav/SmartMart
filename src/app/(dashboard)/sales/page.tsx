import { connection } from "next/server";
import PageHeader from "@/components/PageHeader";
import DataTable from "@/components/DataTable";
import { db } from "@/lib/db";
import { formatInvoiceNo } from "@/app/pos/lib";

const SHOP_TZ = "Asia/Kathmandu";

const columns = ["Receipt", "Date", "Cashier", "Payment", "Total (Rs)"];

const paymentLabels: Record<string, string> = {
  CASH: "Cash",
  CARD: "Card",
  QR: "QR",
  CREDIT: "Credit",
};

// e.g. 2026-11-22 10:12, in the shop's time zone
const formatDateTime = (date: Date) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: SHOP_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  })
    .format(date)
    .replace(",", "");

export default async function Page() {
  await connection(); // always show current sales, never a build-time copy

  const sales = await db.sale.findMany({
    orderBy: { createdAt: "desc" },
    take: 100, // latest 100 for now; add paging or a date filter later
    select: {
      receiptNo: true,
      createdAt: true,
      cashierName: true,
      paymentMethod: true,
      total: true,
    },
  });

  const rows: (string | number)[][] = sales.map((sale) => [
    formatInvoiceNo(sale.receiptNo),
    formatDateTime(sale.createdAt),
    sale.cashierName,
    paymentLabels[sale.paymentMethod] ?? sale.paymentMethod,
    sale.total,
  ]);

  return (
    <>
      <PageHeader title="Sales" subtitle="Every sale made at the counter." />
      <div className="bg-white text-black border-0 rounded-lg">
        {rows.length === 0 ? (
          <p className="p-6 text-sm text-[#6b4455]">
            No sales yet. Completed sales from the counter will show up here.
          </p>
        ) : (
          <DataTable columns={columns} rows={rows} />
        )}
      </div>
    </>
  );
}