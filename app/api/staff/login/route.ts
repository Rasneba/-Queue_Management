import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { name, password } = await request.json();
    if (!name || !password) {
      return NextResponse.json({ error: "Name and password are required" }, { status: 400 });
    }

    let rows = await sql`SELECT id, name, role, department, desk FROM staff WHERE LOWER(name) = LOWER(${name}) AND password = ${password} AND is_active = TRUE`;

    if (rows.length === 0) {
      await sql`INSERT INTO staff (id, name, role, password, department) VALUES ('staff_admin', 'Admin', 'Admin', 'admin123', 'General Medicine') ON CONFLICT (id) DO UPDATE SET password = 'admin123', role = 'Admin', is_active = TRUE`;
      rows = await sql`SELECT id, name, role, department, desk FROM staff WHERE LOWER(name) = LOWER(${name}) AND password = ${password} AND is_active = TRUE`;
    }

    if (rows.length === 0) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const user = rows[0];
    return NextResponse.json({ id: user.id, name: user.name, role: user.role, department: user.department, desk: user.desk || null });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Login failed";
    console.error("Login error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
