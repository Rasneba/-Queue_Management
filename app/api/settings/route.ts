import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";

const VALID_CATEGORIES = ["department", "role", "desk"];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  if (!category || !VALID_CATEGORIES.includes(category)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }
  const rows = await sql`SELECT id, name, created_at FROM system_settings WHERE category = ${category} ORDER BY name ASC`;
  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  const { category, name } = await request.json();
  if (!category || !name || !VALID_CATEGORIES.includes(category)) {
    return NextResponse.json({ error: "Valid category and name are required" }, { status: 400 });
  }
  try {
    const rows = await sql`INSERT INTO system_settings (category, name) VALUES (${category}, ${name.trim()}) RETURNING id, name, created_at`;
    return NextResponse.json(rows[0]);
  } catch (err: any) {
    if (err.message?.includes("unique") || err.message?.includes("duplicate")) {
      return NextResponse.json({ error: `"${name.trim()}" already exists` }, { status: 409 });
    }
    throw err;
  }
}
