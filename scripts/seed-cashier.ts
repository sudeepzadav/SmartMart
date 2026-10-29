// scripts/seed-cashier.ts
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const [name, pin, email] = process.argv.slice(2);

  if (!name || !pin) {
    throw new Error(
      'Usage: npx tsx scripts/seed-cashier.ts "Name" 123456 [email]'
    );
  }
  if (!/^\d{6}$/.test(pin)) {
    throw new Error("PIN must be exactly 6 digits");
  }

  const pinHash = await bcrypt.hash(pin, 10);

  const existing = await prisma.user.findFirst({
    where: { name, role: "CASHIER" },
  });

  const user = existing
    ? await prisma.user.update({
        where: { id: existing.id },
        data: { pinHash, active: true },
      })
    : await prisma.user.create({
        data: {
          name,
          ...(email ? { email: email.toLowerCase() } : {}),
          pinHash,
          role: "CASHIER",
        },
      });

  console.log(existing ? "Cashier updated:" : "Cashier created:", user.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());