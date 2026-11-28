import ExpensesView from "@/components/ExpensesView";
import { db } from "@/lib/db";

// Always read fresh data, never a cached copy.
export const dynamic = "force-dynamic";

// Start of the current month in Nepal time (UTC+5:45, no daylight saving).
function nepalMonthStart() {
  const offset = (5 * 60 + 45) * 60 * 1000;
  const nowNepal = new Date(Date.now() + offset);
  return new Date(
    Date.UTC(nowNepal.getUTCFullYear(), nowNepal.getUTCMonth(), 1) - offset
  );
}

export default async function Page() {
  const [expenses, month] = await Promise.all([
    db.expense.findMany({
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take: 200, // the latest 200 expenses
      select: { id: true, date: true, title: true, category: true, amount: true, note: true },
    }),
    db.expense.aggregate({
      where: { date: { gte: nepalMonthStart() } },
      _sum: { amount: true },
    }),
  ]);

  const rows = expenses.map((e) => ({
    id: e.id,
    date: e.date.toLocaleDateString("en-CA", { timeZone: "Asia/Kathmandu" }), // 2026-11-26
    title: e.title,
    category: e.category,
    amount: e.amount,
    note: e.note,
  }));
  const categories = Array.from(
    new Set(expenses.map((e) => e.category).filter((c): c is string => !!c))
  );

  return (
    <ExpensesView
      expenses={rows}
      categories={categories}
      monthTotal={month._sum.amount ?? 0}
    />
  );
}