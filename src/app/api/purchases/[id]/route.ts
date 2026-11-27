import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { addReceivedStock, ProductMissingError } from "@/lib/Purchase-stock";

const OBJECT_ID = /^[a-f\d]{24}$/i;

const fail = (error: string, status: number) =>
  NextResponse.json({ error }, { status });

class NotFoundError extends Error {}

class AlreadyProcessedError extends Error {
  purchaseStatus: string;

  constructor(purchaseStatus: string) {
    super("PURCHASE_ALREADY_PROCESSED");
    this.purchaseStatus = purchaseStatus;
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return fail("Unauthorized", 401);
    if (session.role !== "ADMIN") {
      return fail("Only admins can update purchases", 403);
    }

    const { id } = await params;
    const body = await request.json().catch(() => null);
    const action = body?.action;

    if (!id || !OBJECT_ID.test(id)) return fail("Invalid purchase ID", 400);
    if (action !== "receive" && action !== "cancel") {
      return fail("Invalid action", 400);
    }

    // Stock and status change together. MongoDB transactions need a replica set.
    const purchase = await db.$transaction(async (tx) => {
      // FIXED: claim the purchase first. Only one request can move it out of
      // "Pending", so a double click or two admins can never add the stock twice.
      const claimed = await tx.purchase.updateMany({
        where: { id, status: "Pending" },
        data:
          action === "receive"
            ? { status: "Received", receivedAt: new Date() }
            : { status: "Cancelled" },
      });

      if (claimed.count !== 1) {
        const existing = await tx.purchase.findUnique({
          where: { id },
          select: { status: true },
        });
        if (!existing) throw new NotFoundError();
        throw new AlreadyProcessedError(existing.status);
      }

      if (action === "receive") {
        const items = await tx.purchaseItem.findMany({
          where: { purchaseId: id },
        });
        await addReceivedStock(tx, items);
      }

      return tx.purchase.findUnique({
        where: { id },
        include: { items: true },
      });
    });

    return NextResponse.json({
      message:
        action === "receive"
          ? "Purchase received and stock updated successfully"
          : "Purchase cancelled",
      purchase,
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return fail("Purchase not found", 404);
    }
    if (error instanceof AlreadyProcessedError) {
      return fail(
        `This purchase is already ${error.purchaseStatus.toLowerCase()}`,
        400
      );
    }
    if (error instanceof ProductMissingError) {
      return fail(
        `A product in this purchase no longer exists (${error.productName})`,
        400
      );
    }

    console.error("UPDATE PURCHASE ERROR:", error);
    return fail("Failed to update purchase", 500);
  }
}