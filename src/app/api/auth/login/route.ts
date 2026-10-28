import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { createSession } from "@/lib/session";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { cashierId, pin, email, password } = body;
  let user: Awaited<ReturnType<typeof db.user.findFirst>> = null;

  if (cashierId && pin) {
   
    const found = await db.user.findFirst({
      where: { id: cashierId, role: "CASHIER", active: true },
    });
    if (found?.pinHash && (await bcrypt.compare(String(pin), found.pinHash))) {
      user = found;
    }
  } else if (email && password) {
    
    const found = await db.user.findFirst({
      where: { email: String(email).toLowerCase(), active: true },
    });
    if (
      found?.passwordHash &&
      (await bcrypt.compare(String(password), found.passwordHash))
    ) {
      user = found;
    }
  } else {
    return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
  }

  if (!user) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  await createSession({ userId: user.id, name: user.name, role: user.role });

  return NextResponse.json({
    user: { id: user.id, name: user.name, role: user.role },
  });
}