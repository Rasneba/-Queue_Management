import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "all";
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const staff = searchParams.get("staff");

  let dateFilter = sql`TRUE`;
  if (dateFrom) dateFilter = sql`check_in_time >= ${dateFrom}::timestamptz`;
  if (dateTo) dateFilter = sql`${dateFilter} AND check_in_time <= (${dateTo}::timestamptz + INTERVAL '1 day')`;

  let sessionDateFilter = sql`TRUE`;
  if (dateFrom) sessionDateFilter = sql`start_time >= ${dateFrom}::timestamptz`;
  if (dateTo) sessionDateFilter = sql`${sessionDateFilter} AND start_time <= (${dateTo}::timestamptz + INTERVAL '1 day')`;

  const result: Record<string, unknown> = {};

  if (type === "triage" || type === "all") {
    const triageStats = await sql`
      SELECT
        triage_priority,
        COUNT(*)::int AS count,
        ROUND(AVG(triage_score)::numeric, 1) AS avg_score
      FROM patients
      WHERE ${dateFilter}
      GROUP BY triage_priority
      ORDER BY count DESC
    `;

    const totalPatients = await sql`
      SELECT COUNT(*)::int AS total FROM patients WHERE ${dateFilter}
    `;

    const completedPatients = await sql`
      SELECT COUNT(*)::int AS total FROM patients
      WHERE status = 'Completed' AND ${dateFilter}
    `;

    const avgWait = await sql`
      SELECT ROUND(AVG(estimated_wait_minutes)::numeric, 1) AS avg_wait
      FROM patients WHERE status != 'Completed' AND ${dateFilter}
    `;

    result.triage = {
      byPriority: triageStats.map((r) => ({
        priority: r.triage_priority,
        count: r.count,
        avgScore: Number(r.avg_score),
      })),
      totalPatients: totalPatients[0].total,
      completedPatients: completedPatients[0].total,
      avgWaitMinutes: Number(avgWait[0].avg_wait || 0),
    };
  }

  if (type === "reception" || type === "all") {
    const checkInsByHour = await sql`
      SELECT
        EXTRACT(HOUR FROM check_in_time)::int AS hour,
        COUNT(*)::int AS count
      FROM patients
      WHERE ${dateFilter}
      GROUP BY hour ORDER BY hour
    `;

    const statusCounts = await sql`
      SELECT
        status,
        COUNT(*)::int AS count
      FROM patients
      WHERE ${dateFilter}
      GROUP BY status
    `;

    result.reception = {
      checkInsByHour: checkInsByHour.map((r) => ({ hour: r.hour, count: r.count })),
      statusBreakdown: statusCounts.map((r) => ({ status: r.status, count: r.count })),
    };
  }

  if (type === "doctor" || type === "all") {
    let doctorFilter = sessionDateFilter;
    if (staff) doctorFilter = sql`${doctorFilter} AND doctor_name = ${staff}`;

    const doctorSessions = await sql`
      SELECT
        doctor_name,
        COUNT(*)::int AS total_shifts,
        COALESCE(SUM(
          CASE WHEN end_time IS NOT NULL THEN
            EXTRACT(EPOCH FROM (end_time - start_time)) / 60
          ELSE 0 END
        )::int, 0) AS total_minutes,
        COALESCE(SUM(array_length(patients_treated, 1)), 0)::int AS total_patients_treated
      FROM doctor_sessions
      WHERE ${doctorFilter}
      GROUP BY doctor_name
      ORDER BY total_patients_treated DESC
    `;

    const allStaff = await sql`
      SELECT DISTINCT doctor_name FROM doctor_sessions ORDER BY doctor_name
    `;

    result.doctor = {
      byDoctor: doctorSessions.map((r) => ({
        doctorName: r.doctor_name,
        totalShifts: r.total_shifts,
        totalMinutes: r.total_minutes,
        totalPatientsTreated: r.total_patients_treated,
        avgPatientsPerShift: r.total_shifts > 0
          ? Math.round((r.total_patients_treated / r.total_shifts) * 10) / 10
          : 0,
      })),
      allStaff: allStaff.map((r) => r.doctor_name),
    };
  }

  return NextResponse.json(result);
}
