import { NextResponse } from "next/server";
import sql from "@/lib/db";

export async function GET() {
  const rows = await sql`
    SELECT * FROM doctor_sessions WHERE is_active = TRUE ORDER BY start_time ASC
  `;
  const doctors = rows.map((r) => ({
    id: r.id,
    doctorName: r.doctor_name,
    room: r.room,
    department: r.department,
    startTime: r.start_time,
    endTime: r.end_time,
    isActive: r.is_active,
    patientsTreated: r.patients_treated,
  }));
  return NextResponse.json(doctors);
}
