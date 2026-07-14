import { NextResponse } from "next/server";
import sql from "@/lib/db";

export async function GET() {
  const rows = await sql`
    SELECT * FROM doctor_sessions
    WHERE is_active = FALSE AND end_time IS NOT NULL
    ORDER BY end_time DESC
    LIMIT 100
  `;
  const history = rows.map((r) => ({
    id: r.id,
    doctorName: r.doctor_name,
    room: r.room,
    department: r.department,
    startTime: r.start_time,
    endTime: r.end_time,
    isActive: r.is_active,
    patientsTreated: r.patients_treated,
    durationMinutes: r.start_time && r.end_time
      ? Math.max(1, Math.round((new Date(r.end_time).getTime() - new Date(r.start_time).getTime()) / 60000))
      : 0,
  }));
  return NextResponse.json(history);
}
