import { connection, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET() {
  await connection();

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const products = await db.product.findMany({
    where: { active: true },
    select: { id: true, name: true, barcode: true, price: true, stock: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(products);
}