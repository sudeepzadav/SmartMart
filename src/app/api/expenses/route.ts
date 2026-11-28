import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCashier } from "@/lib/Cashier"; // gives the signed-in user (see src/lib/cashier.ts)

export async function POST(req: Request) {
  const user = await getCashier();
  if (!user) {
    return NextResponse.json({ error: "You are not signed in." }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const bad = (error: string) => NextResponse.json({ error }, { status: 400 });

  // Always validate on the server too; the form checks can be bypassed.
  const title = String(body.title ?? "").trim().slice(0, 100);
  const category = String(body.category ?? "").trim().slice(0, 50);
  const note = String(body.note ?? "").trim().slice(0, 500);
  const amount = Number(body.amount);
  const dateText = String(body.date ?? "");

  if (!title) return bad("Title is required.");
  if (!(amount > 0) || amount > 1_000_000_000) return bad("Amount must be greater than 0.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateText)) return bad("Choose a valid date.");
  const date = new Date(`${dateText}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return bad("Choose a valid date.");

  try {
    const created = await db.expense.create({
      data: {
        title,
        category: category || null,
        amount: Math.round(amount * 100) / 100,
        note: note || null,
        date,
        createdById: user.id,
      },
      select: { id: true },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Could not save the expense." }, { status: 500 });
  }
}