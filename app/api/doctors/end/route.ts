import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";

export async function POST(request: NextRequest) {
  const { id } = await request.json();
  if (!id) {
    return NextResponse.json({ error: "Missing session ID" }, { status: 400 });
  }

  await sql`
    UPDATE doctor_sessions SET is_active = FALSE, end_time = NOW() WHERE id = ${id}
  `;

  return NextResponse.json({ ok: true });
}
