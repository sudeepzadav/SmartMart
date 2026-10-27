import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "@/lib/token";

// Pages only the owner can open
const ADMIN_ONLY = ["/reports", "/settings", "/expenses", "/purchases", "/suppliers"];
const PUBLIC = ["/", "/login"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isApi = pathname.startsWith("/api");

  // Login, logout and the cashier name list must work without a session
  if (pathname.startsWith("/api/auth")) return NextResponse.next();

  const token = request.cookies.get("session")?.value;
  const session = token ? await verifyToken(token) : null;

  if (PUBLIC.includes(pathname)) {
    // Signed-in people skip the login screen
    if (session && pathname === "/login") {
      const home = session.role === "ADMIN" ? "/dashboard" : "/pos";
      return NextResponse.redirect(new URL(home, request.url));
    }
    return NextResponse.next();
  }

  if (!session) {
    if (isApi) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const adminOnly = ADMIN_ONLY.some((p) => pathname === p || pathname.startsWith(p + "/"));
  if (adminOnly && session.role !== "ADMIN") {
    if (isApi) return NextResponse.json({ error: "Not allowed." }, { status: 403 });
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};