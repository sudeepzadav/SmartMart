import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { createSession } from "@/lib/session";
import type { Role } from "@/lib/token";
import type { User } from "@prisma/client";

const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 5;

type Body = { mode?: string; email?: string; password?: string; userId?: number; pin?: string };

const fail = (error: string, status: number) => NextResponse.json({ error }, { status });

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body) return fail("Invalid request.", 400);

  let user: User | null = null;
  let secret = "";
  let hash: string | null = null;
  let generic = "";

  if (body.mode === "owner") {
    const email = String(body.email ?? "").trim().toLowerCase();
    secret = String(body.password ?? "");
    if (!email || !secret) return fail("Enter your email and password.", 400);
    user = await db.user.findUnique({ where: { email } });
    if (user && user.role !== "ADMIN") user = null;
    hash = user?.passwordHash ?? null;
    generic = "Wrong email or password.";
  } else if (body.mode === "cashier") {
    secret = String(body.pin ?? "");
    const id = Number(body.userId);
    if (!Number.isInteger(id)) return fail("Choose your name first.", 400);
    if (!/^\d{4,6}$/.test(secret)) return fail("Enter your 4 to 6 digit PIN.", 400);
    user = await db.user.findFirst({ where: { id, role: "CASHIER" } });
    hash = user?.pinHash ?? null;
    generic = "Wrong PIN.";
  } else {
    return fail("Invalid request.", 400);
  }

  if (!user || !user.active || !hash) return fail(generic, 401);

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const mins = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
    return fail(`Too many wrong tries. Try again in ${mins} minute(s).`, 429);
  }

  const ok = await bcrypt.compare(secret, hash);
  if (!ok) {
    const attempts = user.failedAttempts + 1;
    const lock = attempts >= MAX_ATTEMPTS;
    await db.user.update({
      where: { id: user.id },
      data: {
        failedAttempts: lock ? 0 : attempts,
        lockedUntil: lock ? new Date(Date.now() + LOCK_MINUTES * 60000) : null,
      },
    });
    return lock
      ? fail(`Too many wrong tries. Locked for ${LOCK_MINUTES} minutes.`, 429)
      : fail(generic, 401);
  }

  await db.user.update({ where: { id: user.id }, data: { failedAttempts: 0, lockedUntil: null } });
  await createSession({ userId: user.id, name: user.name, role: user.role as Role });
  return NextResponse.json({ ok: true, role: user.role, name: user.name });
}