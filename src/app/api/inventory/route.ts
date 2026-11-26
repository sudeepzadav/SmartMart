import { NextResponse } from "next/server";
import { db } from "@/lib/db"; // change this if your db.ts exports the client under another name

// TODO: check the logged-in session here (see src/lib/session.ts) before allowing access.

const MODES = ["set", "add", "remove"] as const;
type Mode = (typeof MODES)[number];

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const bad = (error: string, status = 400) =>
    NextResponse.json({ error }, { status });

  const productId = String(body.productId ?? "");
  const mode = String(body.mode ?? "") as Mode;
  const quantity = Number(body.quantity);

  if (!/^[a-f0-9]{24}$/i.test(productId)) return bad("Choose a product.");
  if (!MODES.includes(mode)) return bad("Invalid adjustment type.");
  if (!Number.isInteger(quantity) || quantity < 0 || quantity > 1_000_000)
    return bad("Quantity must be a whole number, 0 or more.");
  if (mode !== "set" && quantity === 0) return bad("Quantity must be at least 1.");

  try {
    if (mode === "set") {
      const updated = await db.product.update({
        where: { id: productId },
        data: { stock: quantity },
        select: { stock: true },
      });
      return NextResponse.json({ stock: updated.stock });
    }

    if (mode === "add") {
      const updated = await db.product.update({
        where: { id: productId },
        data: { stock: { increment: quantity } },
        select: { stock: true },
      });
      return NextResponse.json({ stock: updated.stock });
    }

    // remove: never let stock go below zero
    const r = await db.product.updateMany({
      where: { id: productId, stock: { gte: quantity } },
      data: { stock: { decrement: quantity } },
    });
    if (r.count !== 1) return bad("You cannot remove more than the current stock.");
    const after = await db.product.findUnique({
      where: { id: productId },
      select: { stock: true },
    });
    return NextResponse.json({ stock: after?.stock ?? 0 });
  } catch (e) {
    if ((e as { code?: string }).code === "P2025") return bad("Product not found.", 404);
    console.error(e);
    return bad("Could not update the stock.", 500);
  }
}