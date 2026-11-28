import { db } from "@/lib/db";

export type Cashier = { id: string; name: string };

export async function getCashier(): Promise<Cashier | null> {
  if (process.env.NODE_ENV === "production") return null;
  return db.user.findFirst({
    where: { active: true },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true },
  });
}