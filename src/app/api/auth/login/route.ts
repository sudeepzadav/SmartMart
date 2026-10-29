
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { createSession } from "@/lib/session";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid request" },
        { status: 400 }
      );
    }

    const { mode, pin, email, password } = body;

    // Support either field name from the login page.
    const cashierId = body.cashierId ?? body.userId;

    let user: Awaited<ReturnType<typeof db.user.findFirst>> = null;

    // CASHIER LOGIN
    if (mode === "cashier" || cashierId != null) {
      if (cashierId == null || pin == null || String(pin) === "") {
        return NextResponse.json(
          { error: "Cashier ID and PIN are required" },
          { status: 400 }
        );
      }

      const found = await db.user.findFirst({
        where: {
          id: cashierId,
          role: "CASHIER",
          active: true,
        },
      });

      if (
        found?.pinHash &&
        (await bcrypt.compare(String(pin), found.pinHash))
      ) {
        user = found;
      }
    }

    // OWNER LOGIN
    else if (mode === "owner" || email != null || password != null) {
      if (
        typeof email !== "string" ||
        !email.trim() ||
        typeof password !== "string" ||
        !password
      ) {
        return NextResponse.json(
          { error: "Email and password are required" },
          { status: 400 }
        );
      }

      const found = await db.user.findFirst({
        where: {
          email: email.trim().toLowerCase(),
          role: "ADMIN",
          active: true,
        },
      });

      if (
        found?.passwordHash &&
        (await bcrypt.compare(password, found.passwordHash))
      ) {
        user = found;
      }
    } else {
      return NextResponse.json(
        { error: "Please select a login method and provide credentials" },
        { status: 400 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Create the authenticated session.
    await createSession({
      userId: user.id,
      name: user.name,
      role: user.role,
    });

    // Return role in both formats for compatibility.
    return NextResponse.json({
      role: user.role,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return NextResponse.json(
      { error: "An unexpected error occurred while signing in." },
      { status: 500 }
    );
  }
}
