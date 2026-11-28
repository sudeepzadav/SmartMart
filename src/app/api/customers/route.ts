import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// TODO: check the logged-in session here (see src/lib/session.ts) before allowing access.

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const bad = (error: string) => NextResponse.json({ error }, { status: 400 });

  // Always validate on the server too; the form checks can be bypassed.
  const name = String(body.name ?? "").trim().slice(0, 100);
  const phone = String(body.phone ?? "").trim();
  const creditBalance =
    body.creditBalance === "" || body.creditBalance == null
      ? 0
      : Number(body.creditBalance);

  if (!name) return bad("Customer name is required.");
  if (phone && !/^[0-9+\-() ]{5,20}$/.test(phone))
    return bad("Enter a valid phone number (digits, spaces, + and - only).");
  if (!(creditBalance >= 0) || creditBalance > 100_000_000)
    return bad("Opening credit must be 0 or more.");

  try {
    // Two customers can share a name, but not a phone number.
    if (phone) {
      const exists = await db.customer.findFirst({
        where: { active: true, phone },
        select: { id: true },
      });
      if (exists) {
        return NextResponse.json(
          { error: "A customer with this phone number already exists." },
          { status: 409 }
        );
      }
    }

    const created = await db.customer.create({
      data: {
        name,
        active: true,
        creditBalance: Math.round(creditBalance * 100) / 100,
        ...(phone ? { phone } : {}),
      },
      select: { id: true, name: true, phone: true, creditBalance: true },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Could not save the customer." }, { status: 500 });
  }
}