import { NextResponse } from "next/server";
import { db } from "@/lib/db"; // change this if your db.ts exports the client under another name

// TODO: check the logged-in session here (see src/lib/session.ts) before allowing access.

type Row = {
  id: string;
  barcode: string | null;
  name: string;
  categoryId: string | null;
  category: { name: string } | null;
  price: number;
  costPrice: number;
  stock: number;
  lowStockAt: number;
};

// Shape used by the pages.
const toRecord = (p: Row) => ({
  id: p.id,
  barcode: p.barcode ?? "",
  name: p.name,
  categoryId: p.categoryId ?? "",
  categoryName: p.category?.name ?? "",
  price: p.price,
  costPrice: p.costPrice,
  stock: p.stock,
  lowStockAt: p.lowStockAt,
});

export async function GET() {
  const [items, categories] = await Promise.all([
    db.product.findMany({
      where: { active: true },
      orderBy: { createdAt: "asc" },
      include: { category: { select: { name: true } } },
    }),
    db.category.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);
  return NextResponse.json({ products: items.map(toRecord), categories });
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const name = String(body.name ?? "").trim();
  let barcode = String(body.barcode ?? "").trim();
  const categoryId = String(body.categoryId ?? "").trim();
  const price = Number(body.price);
  const costPrice = Number(body.costPrice ?? 0);
  const stock = Number(body.stock);
  const lowStockAt = Number(body.lowStockAt ?? 5);

  // Always validate on the server too; the form checks can be bypassed.
  const bad = (error: string) => NextResponse.json({ error }, { status: 400 });
  if (!name) return bad("Name is required.");
  if (!(price > 0)) return bad("Price must be greater than 0.");
  if (!(costPrice >= 0)) return bad("Cost price cannot be negative.");
  if (!Number.isInteger(stock) || stock < 0)
    return bad("Stock must be a whole number, 0 or more.");
  if (!Number.isInteger(lowStockAt) || lowStockAt < 0)
    return bad("Low-stock alert must be a whole number, 0 or more.");
  if (categoryId && !/^[a-f0-9]{24}$/i.test(categoryId)) return bad("Invalid category.");

  // MongoDB treats a missing value in a unique field as a duplicate of other missing
  // values, so products without a package barcode get their own internal code.
  if (!barcode) {
    barcode = `SM${Date.now()}${String(Math.floor(Math.random() * 1000)).padStart(3, "0")}`;
  }

  try {
    const created = await db.product.create({
      data: {
        name,
        barcode,
        price,
        costPrice,
        stock,
        lowStockAt,
        ...(categoryId ? { categoryId } : {}),
      },
      include: { category: { select: { name: true } } },
    });
    return NextResponse.json(toRecord(created), { status: 201 });
  } catch (e) {
    const err = e as { code?: string };
    if (err.code === "P2002") {
      return NextResponse.json(
        { error: "This barcode already belongs to another product." },
        { status: 409 }
      );
    }
    console.error(e);
    return NextResponse.json({ error: "Could not save the product." }, { status: 500 });
  }
}