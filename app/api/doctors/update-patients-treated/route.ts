import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";

export async function POST(request: NextRequest) {
  const { sessionId, patientId } = await request.json();
  if (!sessionId || !patientId) {
    return NextResponse.json({ error: "Missing sessionId or patientId" }, { status: 400 });
  }

  await sql`
    UPDATE doctor_sessions
    SET patients_treated = array_append(patients_treated, ${patientId})
    WHERE id = ${sessionId} AND NOT (${patientId} = ANY(patients_treated))
  `;

  return NextResponse.json({ ok: true });
}
