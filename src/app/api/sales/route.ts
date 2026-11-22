import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { calcTotals, round2 } from "@/app/pos/lib";
import type { CartLine, DiscountType } from "@/app/pos/types";

class SaleError extends Error {}

type Body = {
  items?: { productId: string; quantity: number }[];
  paymentMethod?: "CASH" | "CARD" | "QR";
  discountType?: DiscountType;
  discountValue?: string | number;
  customerName?: string;
  tendered?: number | null;
};

const OBJECT_ID = /^[a-f0-9]{24}$/i;

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body: Body | null = await request.json().catch(() => null);
  const method = body?.paymentMethod;

  if (
    !body?.items?.length ||
    (method !== "CASH" && method !== "CARD" && method !== "QR")
  ) {
    return NextResponse.json({ error: "Invalid sale" }, { status: 400 });
  }

  // Merge duplicate lines and validate quantities
  const qtyById = new Map<string, number>();
  for (const item of body.items) {
    const qty = Number(item.quantity);
    if (!OBJECT_ID.test(String(item.productId)) || !Number.isInteger(qty) || qty < 1) {
      return NextResponse.json({ error: "Invalid item" }, { status: 400 });
    }
    qtyById.set(item.productId, (qtyById.get(item.productId) ?? 0) + qty);
  }

  const discountType: DiscountType =
    body.discountType === "percent" ? "percent" : "amount";
  const discountValue = String(body.discountValue ?? "");
  const customerName = (body.customerName ?? "").trim().slice(0, 100);

  try {
    // Needs a MongoDB replica set (you already set up rs0)
    const sale = await db.$transaction(async (tx) => {
      const products = await tx.product.findMany({
        where: { id: { in: [...qtyById.keys()] }, active: true },
      });
      if (products.length !== qtyById.size) {
        throw new SaleError("A product in the cart is no longer available");
      }

      // Prices come from the database. VAT and discount are worked out here
      // with the same calcTotals the counter screen uses, so the numbers match.
      const lines: CartLine[] = products.map((p) => ({
        sku: p.id,
        barcode: p.barcode ?? "",
        name: p.name,
        price: p.price,
        qty: qtyById.get(p.id)!,
      }));
      const totals = calcTotals(lines, discountType, discountValue);

      let amountPaid = totals.total;
      if (method === "CASH") {
        amountPaid = Number(body.tendered);
        if (!Number.isFinite(amountPaid) || amountPaid < totals.total) {
          throw new SaleError("Cash received is less than the total");
        }
      }

      // Reduce stock only if enough is left
      for (const line of lines) {
        const result = await tx.product.updateMany({
          where: { id: line.sku, stock: { gte: line.qty } },
          data: { stock: { decrement: line.qty } },
        });
        if (result.count !== 1) {
          throw new SaleError(`Not enough stock for ${line.name}`);
        }
      }

      const costById = new Map(products.map((p) => [p.id, p.costPrice]));
      const receiptNo = (await tx.sale.count()) + 1;

      return tx.sale.create({
        data: {
          receiptNo,
          cashierId: session.userId,
          cashierName: session.name,
          customerName: customerName || null,
          items: {
            set: lines.map((l) => ({
              productId: l.sku,
              name: l.name,
              price: l.price,
              costPrice: costById.get(l.sku) ?? 0,
              quantity: l.qty,
            })),
          },
          subtotal: totals.subtotal,
          discount: totals.discount,
          vat: totals.vat,
          total: totals.total,
          paymentMethod: method,
          amountPaid,
          change: round2(amountPaid - totals.total),
        },
      });
    });

    return NextResponse.json({ sale }, { status: 201 });
  } catch (error) {
    if (error instanceof SaleError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    // Two sales saved at the same instant got the same bill number
    if ((error as { code?: string }).code === "P2002") {
      return NextResponse.json(
        { error: "Another sale was saved at the same moment. Try again." },
        { status: 409 }
      );
    }
    console.error(error);
    return NextResponse.json(
      { error: "Could not complete the sale" },
      { status: 500 }
    );
  }
}