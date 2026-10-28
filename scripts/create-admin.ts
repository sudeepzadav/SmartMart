// scripts/create-admin.ts
import "dotenv/config";
import argon2 from "argon2";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const EMAIL = "yadavsudeep367@gmail.com";

async function main() {
  const password = process.env.ADMIN_PASSWORD;
  const pin = process.env.ADMIN_PIN;

  if (!password || !pin) {
    throw new Error("Set ADMIN_PASSWORD and ADMIN_PIN in .env first");
  }
  if (password.length < 8) {
    throw new Error("ADMIN_PASSWORD must be at least 8 characters");
  }
  if (!/^\d{6}$/.test(pin)) {
    throw new Error("ADMIN_PIN must be exactly 6 digits");
  }

  const passwordHash = await argon2.hash(password);
  const pinHash = await argon2.hash(pin);

  const existing = await prisma.user.findUnique({ where: { email: EMAIL } });

  const user = existing
    ? await prisma.user.update({
        where: { id: existing.id },
        data: { passwordHash, pinHash, role: "ADMIN", active: true },
      })
    : await prisma.user.create({
        data: {
          name: "sudeep",
          email: EMAIL,
          passwordHash,
          pinHash,
          role: "ADMIN",
        },
      });

  console.log(existing ? "Admin updated:" : "Admin created:", user.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());