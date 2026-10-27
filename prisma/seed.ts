
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const adminPassword =
    process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!";

  await db.user.upsert({
    where: { email: "admin@smartmart.com" },
    update: {},
    create: {
      name: "Owner",
      email: "admin@smartmart.com",
      passwordHash: await bcrypt.hash(adminPassword, 10),
      role: "ADMIN",
    },
  });

  for (const [name, pin] of [
    ["Asha", "1234"],
    ["Ram", "4321"],
  ]) {
    const exists = await db.user.findFirst({
      where: { name, role: "CASHIER" },
    });

    if (!exists) {
      await db.user.create({
        data: {
          name,
          pinHash: await bcrypt.hash(pin, 10),
          role: "CASHIER",
        },
      });
    }
  }

  const grocery = await db.category.upsert({
    where: { name: "Grocery" },
    update: {},
    create: { name: "Grocery" },
  });

  const dairy = await db.category.upsert({
    where: { name: "Dairy" },
    update: {},
    create: { name: "Dairy" },
  });

  const snacks = await db.category.upsert({
    where: { name: "Snacks" },
    update: {},
    create: { name: "Snacks" },
  });

  const products = [
    {
      sku: "P001",
      name: "Basmati rice 5kg",
      price: 950,
      stock: 42,
      categoryId: grocery.id,
    },
    {
      sku: "P002",
      name: "Dairy milk 1L",
      price: 120,
      stock: 60,
      categoryId: dairy.id,
    },
    {
      sku: "P003",
      name: "Instant noodles",
      price: 30,
      stock: 200,
      categoryId: snacks.id,
    },
    {
      sku: "P004",
      name: "Tea 250g",
      price: 210,
      stock: 35,
      categoryId: grocery.id,
    },
  ];

  for (const product of products) {
    await db.product.upsert({
      where: { sku: product.sku },
      update: {},
      create: product,
    });
  }

  console.log(
    "Seed completed. Admin: admin@smartmart.com",
    "| Cashiers: Asha 1234, Ram 4321"
  );
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
