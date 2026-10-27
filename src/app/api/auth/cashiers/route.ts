import { NextResponse, connection } from "next/server";
import { db } from "@/lib/db";

// Names only, so the login screen can show "tap your name". No PINs or hashes.
export async function GET() {
  await connection(); // always read the current list, never a build-time copy
  const cashiers = await db.user.findMany({
    where: { role: "CASHIER", active: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(cashiers);
}