import { NextResponse } from "next/server";
import { db } from "@/lib/db"; // change this if your db.ts exports the client under another name

// TODO: check the logged-in session here (see src/lib/session.ts) before allowing access.

export async function GET() {
  const categories = await db.category.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
  return NextResponse.json(categories);
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const name = String(body.name ?? "").trim();
  if (!name) {
    return NextResponse.json({ error: "Category name is required." }, { status: 400 });
  }

  try {
    // Block duplicates regardless of upper/lower case ("Dairy" vs "dairy").
    const exists = await db.category.findFirst({
      where: { name: { equals: name, mode: "insensitive" } },
      select: { id: true },
    });
    if (exists) {
      return NextResponse.json(
        { error: "This category already exists." },
        { status: 409 }
      );
    }

    const created = await db.category.create({
      data: { name },
      select: { id: true, name: true },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Could not save the category." }, { status: 500 });
  }
}