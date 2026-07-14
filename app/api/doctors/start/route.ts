import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";

export async function POST(request: NextRequest) {
  const { doctorName, room, department } = await request.json();
  if (!doctorName || !room || !department) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const id = `doc_${Date.now()}`;
  await sql`
    INSERT INTO doctor_sessions (id, doctor_name, room, department, is_active)
    VALUES (${id}, ${doctorName}, ${room}, ${department}, TRUE)
  `;

  return NextResponse.json({ id, doctorName, room, department, isActive: true });
}
