import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";

export async function GET() {
  const rows = await sql`
    SELECT id, name, role, department, created_at, is_active FROM staff ORDER BY created_at DESC
  `;
  return NextResponse.json(rows.map(r => ({
    id: r.id,
    name: r.name,
    role: r.role,
    department: r.department,
    createdAt: r.created_at,
    isActive: r.is_active,
  })));
}

export async function POST(request: NextRequest) {
  const { name, role, password, department } = await request.json();
  if (!name || !role || !password) {
    return NextResponse.json({ error: "Name, role, and password are required" }, { status: 400 });
  }
  if (!['Reception', 'Triage', 'Doctor'].includes(role)) {
    return NextResponse.json({ error: "Role must be Reception, Triage, or Doctor" }, { status: 400 });
  }

  const id = `staff_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  await sql`
    INSERT INTO staff (id, name, role, password, department)
    VALUES (${id}, ${name}, ${role}, ${password}, ${department || 'General Medicine'})
  `;

  return NextResponse.json({ id, name, role, department: department || 'General Medicine', isActive: true });
}
