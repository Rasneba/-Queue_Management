import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";

export async function POST(request: NextRequest) {
  const { name, password, role } = await request.json();
  if (!name || !password) {
    return NextResponse.json({ error: "Name and password are required" }, { status: 400 });
  }

  let rows;
  if (role) {
    rows = await sql`SELECT id, name, role, department FROM staff WHERE name = ${name} AND password = ${password} AND role = ${role} AND is_active = TRUE`;
  } else {
    rows = await sql`SELECT id, name, role, department FROM staff WHERE name = ${name} AND password = ${password} AND is_active = TRUE`;
  }

  if (rows.length === 0) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const user = rows[0];
  return NextResponse.json({ id: user.id, name: user.name, role: user.role, department: user.department });
}
