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
