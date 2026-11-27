import type { Prisma } from "@prisma/client";

type ReceivedItem = {
  productId: string;
  name: string;
  qty: number;
  unitCost: number;
};

export class ProductMissingError extends Error {
  productName: string;

  constructor(productName: string) {
    super(`PRODUCT_NOT_FOUND:${productName}`);
    this.productName = productName;
  }
}

// Adds the received quantities to stock and remembers the latest cost price.
// Always call this inside a db.$transaction so stock and status change together.
export async function addReceivedStock(
  tx: Prisma.TransactionClient,
  items: ReceivedItem[]
) {
  for (const item of items) {
    const result = await tx.product.updateMany({
      where: { id: item.productId },
      data: {
        stock: { increment: item.qty },
        costPrice: item.unitCost,
      },
    });

    if (result.count !== 1) throw new ProductMissingError(item.name);
  }
}