
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "@/lib/token";

const ADMIN_ONLY = [
  "/reports",
  "/settings",
  "/expenses",
  "/purchases",
  "/suppliers",
];

const PUBLIC = ["/", "/login"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isApi = pathname.startsWith("/api");

  // Allow authentication API routes
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // Read session cookie
  const token = request.cookies.get("session")?.value;

  let session = null;

  try {
    session = token ? await verifyToken(token) : null;
  } catch {
    session = null;
  }

  // Handle public routes
  if (PUBLIC.includes(pathname)) {
    if (session && pathname === "/login") {
      const home = session.role === "ADMIN" ? "/dashboard" : "/pos";

      return NextResponse.redirect(new URL(home, request.url));
    }

    return NextResponse.next();
  }

  // Require authentication for all other routes
  if (!session) {
    if (isApi) {
      return NextResponse.json(
        { error: "Not signed in." },
        { status: 401 }
      );
    }

    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Check admin-only routes
  const adminOnly = ADMIN_ONLY.some(
    (route) =>
      pathname === route || pathname.startsWith(`${route}/`)
  );

  if (adminOnly && session.role !== "ADMIN") {
    if (isApi) {
      return NextResponse.json(
        { error: "Not allowed." },
        { status: 403 }
      );
    }

    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
