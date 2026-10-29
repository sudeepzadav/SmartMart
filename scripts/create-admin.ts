import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const EMAIL = "yadavsudeep367@gmail.com";

async function main() {
  const password = process.env.ADMIN_PASSWORD;
  if (!password || password.length < 8) {
    throw new Error("Set ADMIN_PASSWORD (8+ characters) in .env first");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const existing = await prisma.user.findFirst({ where: { email: EMAIL } });

  const user = existing
    ? await prisma.user.update({
        where: { id: existing.id },
        data: { passwordHash, role: "ADMIN", active: true },
      })
    : await prisma.user.create({
        data: { name: "sudeep", email: EMAIL, passwordHash, role: "ADMIN" },
      });

  console.log(existing ? "Admin updated:" : "Admin created:", user.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());