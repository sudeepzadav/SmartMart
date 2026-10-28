import { connection, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  await connection(); 

  const cashiers = await db.user.findMany({
    where: { role: "CASHIER", active: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(cashiers);
}