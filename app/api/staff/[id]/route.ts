import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Missing staff ID" }, { status: 400 });
  }

  await sql`DELETE FROM staff WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Missing staff ID" }, { status: 400 });
  }

  const body = await request.json();
  const { name, role, password, department, desk, category } = body;

  if (!name || !role) {
    return NextResponse.json({ error: "Name and role are required" }, { status: 400 });
  }

  if (password) {
    await sql`
      UPDATE staff SET name = ${name}, role = ${role}, password = ${password},
        department = ${department || 'General Medicine'}, desk = ${desk || null}, category = ${category || ''}
      WHERE id = ${id}
    `;
  } else {
    await sql`
      UPDATE staff SET name = ${name}, role = ${role},
        department = ${department || 'General Medicine'}, desk = ${desk || null}, category = ${category || ''}
      WHERE id = ${id}
    `;
  }

  return NextResponse.json({ ok: true });
}
