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
  if (!name) return bad("Supplier name is required.");
  if (phone && !/^[0-9+\-() ]{5,20}$/.test(phone))
    return bad("Enter a valid phone number (digits, spaces, + and - only).");

  try {
    // Block duplicates regardless of upper/lower case.
    const exists = await db.supplier.findFirst({
      where: { active: true, name: { equals: name, mode: "insensitive" } },
      select: { id: true },
    });
    if (exists) {
      return NextResponse.json(
        { error: "A supplier with this name already exists." },
        { status: 409 }
      );
    }

    const created = await db.supplier.create({
      data: { name, active: true, ...(phone ? { phone } : {}) },
      select: { id: true, name: true, phone: true },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Could not save the supplier." }, { status: 500 });
  }
}