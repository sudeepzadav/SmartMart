import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { addReceivedStock } from "@/lib/Purchase-stock";

export const dynamic = "force-dynamic";

const OBJECT_ID = /^[a-f\d]{24}$/i;

const fail = (error: string, status: number) =>
  NextResponse.json({ error }, { status });

type RawItem = { productId?: unknown; qty?: unknown; unitCost?: unknown };

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return fail("Unauthorized", 401);

    const purchases = await db.purchase.findMany({
      orderBy: { createdAt: "desc" },
      include: { items: true },
    });

    return NextResponse.json({ purchases });
  } catch (error) {
    console.error("GET PURCHASES ERROR:", error);
    return fail("Failed to load purchases", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return fail("Unauthorized", 401);
    if (session.role !== "ADMIN") {
      return fail("Only admins can create purchases", 403);
    }

    const body = await request.json().catch(() => null);
    if (!body) return fail("Invalid request", 400);

    const supplierName = String(body.supplierName ?? "").trim();
    const note = String(body.note ?? "").trim().slice(0, 300);
    const orderDate = new Date(body.orderDate);
    // FIXED: the form's "stock has already arrived" box was ignored before
    const receiveNow = body.receiveNow === true;

    if (!supplierName || supplierName.length > 100) {
      return fail("Supplier name is required", 400);
    }
    if (Number.isNaN(orderDate.getTime())) {
      return fail("A valid order date is required", 400);
    }
    if (!Array.isArray(body.items) || body.items.length === 0) {
      return fail("Add at least one product", 400);
    }

    const requestedItems = (body.items as RawItem[]).map((item) => ({
      productId: String(item.productId ?? ""),
      qty: Number(item.qty),
      unitCost: Number(item.unitCost),
    }));

    for (const item of requestedItems) {
      if (
        !OBJECT_ID.test(item.productId) || // FIXED: a bad id caused a 500 before
        !Number.isInteger(item.qty) ||
        item.qty <= 0 ||
        !Number.isFinite(item.unitCost) ||
        item.unitCost < 0
      ) {
        return fail("Invalid purchase item details", 400);
      }
    }

    // Combine duplicate product IDs.
    const grouped = new Map<
      string,
      { productId: string; qty: number; unitCost: number }
    >();

    for (const item of requestedItems) {
      const existing = grouped.get(item.productId);

      if (existing) {
        if (existing.unitCost !== item.unitCost) {
          return fail("The same product has different buying costs", 400);
        }
        existing.qty += item.qty;
      } else {
        grouped.set(item.productId, { ...item });
      }
    }

    const items = Array.from(grouped.values());
    const productIds = items.map((item) => item.productId);

    const products = await db.product.findMany({
      where: { id: { in: productIds }, active: true },
      select: { id: true, name: true },
    });

    if (products.length !== productIds.length) {
      return fail("One or more products were not found or are inactive", 400);
    }

    const productMap = new Map(products.map((p) => [p.id, p]));

    const purchaseItems = items.map((item) => ({
      productId: item.productId,
      name: productMap.get(item.productId)!.name,
      qty: item.qty,
      unitCost: item.unitCost,
      lineTotal: Number((item.qty * item.unitCost).toFixed(2)),
    }));

    const total = Number(
      purchaseItems.reduce((sum, item) => sum + item.lineTotal, 0).toFixed(2)
    );

    const orderNo = `PO-${Date.now()}`;

    // Needs a MongoDB replica set (you already set up rs0)
    const purchase = await db.$transaction(async (tx) => {
      const created = await tx.purchase.create({
        data: {
          orderNo,
          supplierName,
          orderDate,
          note: note || null,
          total,
          status: receiveNow ? "Received" : "Pending",
          receivedAt: receiveNow ? new Date() : null,
          items: { create: purchaseItems },
        },
        include: { items: true },
      });

      if (receiveNow) await addReceivedStock(tx, created.items);

      return created;
    });

    return NextResponse.json({ purchase }, { status: 201 });
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") {
      return fail("Could not create a unique order number. Try again.", 409);
    }
    console.error("CREATE PURCHASE ERROR:", error);
    return fail("Failed to create purchase", 500);
  }
}