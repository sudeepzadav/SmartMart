import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";

// TODO: check the logged-in session here (see src/lib/session.ts).
// Anyone signed in can read the settings (the POS needs them),
// but only an ADMIN should be allowed to change them.

export async function GET() {
  return NextResponse.json(await getSettings());
}

export async function PUT(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const bad = (error: string) => NextResponse.json({ error }, { status: 400 });

  // Always validate on the server too; the form checks can be bypassed.
  const name = String(body.name ?? "").trim().slice(0, 100);
  const address = String(body.address ?? "").trim().slice(0, 200);
  const phone = String(body.phone ?? "").trim().slice(0, 30);
  const panVat = String(body.panVat ?? "").trim().slice(0, 30);
  const vatRate = Number(body.vatRate);

  if (!name) return bad("Store name is required.");
  if (phone && !/^[0-9+\-() ,/]{3,30}$/.test(phone))
    return bad("Phone can only have digits, spaces and + - ( ) , /");
  if (!Number.isFinite(vatRate) || vatRate < 0 || vatRate > 100)
    return bad("VAT rate must be between 0 and 100.");

  const data = {
    name,
    address: address || null,
    phone: phone || null,
    panVat: panVat || null,
    vatRate: Math.round(vatRate * 100) / 100,
  };

  try {
    await db.storeSetting.upsert({
      where: { key: "store" },
      update: data,
      create: { key: "store", ...data },
    });
    return NextResponse.json(await getSettings());
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Could not save the settings." }, { status: 500 });
  }
}