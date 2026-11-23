import { connection, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

const OBJECT_ID = /^[a-f0-9]{24}$/i;

const bad = (message: string) =>
  NextResponse.json({ error: message }, { status: 400 });

// Used by the counter (/pos) to load the products it can sell
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

// Used by the Products page to add a product (admin only)
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.role !== "ADMIN") {
    return NextResponse.json({ error: "Admins only" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body) return bad("Invalid request");

  const name = String(body.name ?? "").trim();
  const barcode = String(body.barcode ?? "").trim();
  const categoryId = String(body.categoryId ?? "").trim();
  const price = Number(body.price);
  const costPrice = Number(body.costPrice ?? 0);
  const stock = Number(body.stock ?? 0);
  const lowStockAt = Number(body.lowStockAt ?? 5);

  if (!name || name.length > 100) return bad("Enter a product name");
  if (barcode.length < 3 || barcode.length > 50) {
    return bad("Enter a barcode (3 to 50 characters)");
  }
  if (!Number.isFinite(price) || price < 0) return bad("Enter a valid price");
  if (!Number.isFinite(costPrice) || costPrice < 0) {
    return bad("Enter a valid cost price");
  }
  if (!Number.isInteger(stock) || stock < 0) {
    return bad("Stock must be a whole number");
  }
  if (!Number.isInteger(lowStockAt) || lowStockAt < 0) {
    return bad("Low-stock alert must be a whole number");
  }

  if (categoryId) {
    const found = OBJECT_ID.test(categoryId)
      ? await db.category.findUnique({ where: { id: categoryId } })
      : null;
    if (!found) return bad("Category not found");
  }

  try {
    const product = await db.product.create({
      data: {
        name,
        barcode,
        price: Math.round(price * 100) / 100,
        costPrice: Math.round(costPrice * 100) / 100,
        stock,
        lowStockAt,
        categoryId: categoryId || null,
      },
    });
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") {
      return NextResponse.json(
        { error: "A product with this barcode already exists" },
        { status: 409 }
      );
    }
    console.error(error);
    return NextResponse.json(
      { error: "Could not add the product" },
      { status: 500 }
    );
  }
}