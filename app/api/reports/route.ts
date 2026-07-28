import { NextRequest, NextResponse } from "next/server";
import { withRetry, rawQuery } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "all";
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const staff = searchParams.get("staff");

  const dateConditions: string[] = [];
  const dateValues: unknown[] = [];
  let paramIdx = 1;

  if (dateFrom) {
    dateConditions.push(`check_in_time >= $${paramIdx}::timestamptz`);
    dateValues.push(dateFrom);
    paramIdx++;
  }
  if (dateTo) {
    dateConditions.push(`check_in_time <= ($${paramIdx}::timestamptz + INTERVAL '1 day')`);
    dateValues.push(dateTo);
    paramIdx++;
  }

  const dateWhere = dateConditions.length > 0 ? dateConditions.join(" AND ") : "TRUE";

  const sessionDateConditions: string[] = [];
  const sessionDateValues: unknown[] = [];
  let sParamIdx = 1;

  if (dateFrom) {
    sessionDateConditions.push(`start_time >= $${sParamIdx}::timestamptz`);
    sessionDateValues.push(dateFrom);
    sParamIdx++;
  }
  if (dateTo) {
    sessionDateConditions.push(`start_time <= ($${sParamIdx}::timestamptz + INTERVAL '1 day')`);
    sessionDateValues.push(dateTo);
    sParamIdx++;
  }

  const sessionDateWhere = sessionDateConditions.length > 0 ? sessionDateConditions.join(" AND ") : "TRUE";

  const result: Record<string, unknown> = {};

  if (type === "triage" || type === "all") {
    const [triageStats, totalPatients, completedPatients, avgWait] = await Promise.all([
      withRetry(() => rawQuery(
        `SELECT triage_priority, COUNT(*)::int AS count, ROUND(AVG(triage_score)::numeric, 1) AS avg_score FROM patients WHERE ${dateWhere} GROUP BY triage_priority ORDER BY count DESC`,
        dateValues
      )),
      withRetry(() => rawQuery(
        `SELECT COUNT(*)::int AS total FROM patients WHERE ${dateWhere}`,
        dateValues
      )),
      withRetry(() => rawQuery(
        `SELECT COUNT(*)::int AS total FROM patients WHERE status = 'Completed' AND ${dateWhere}`,
        dateValues
      )),
      withRetry(() => rawQuery(
        `SELECT ROUND(AVG(estimated_wait_minutes)::numeric, 1) AS avg_wait FROM patients WHERE status != 'Completed' AND ${dateWhere}`,
        dateValues
      )),
    ]);

    result.triage = {
      byPriority: triageStats.map((r: Record<string, unknown>) => ({
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
    const checkInsByHour = await withRetry(() => rawQuery(
      `SELECT EXTRACT(HOUR FROM check_in_time)::int AS hour, COUNT(*)::int AS count FROM patients WHERE ${dateWhere} GROUP BY hour ORDER BY hour`,
      dateValues
    ));

    const statusCounts = await withRetry(() => rawQuery(
      `SELECT status, COUNT(*)::int AS count FROM patients WHERE ${dateWhere} GROUP BY status`,
      dateValues
    ));

    result.reception = {
      checkInsByHour: checkInsByHour.map((r: Record<string, unknown>) => ({ hour: r.hour, count: r.count })),
      statusBreakdown: statusCounts.map((r: Record<string, unknown>) => ({ status: r.status, count: r.count })),
    };
  }

  if (type === "doctor" || type === "all") {
    let doctorDateWhere = sessionDateWhere;
    const doctorValues = [...sessionDateValues];
    if (staff) {
      doctorDateWhere += ` AND doctor_name = $${doctorValues.length + 1}`;
      doctorValues.push(staff);
    }

    const [doctorSessions, allStaff] = await Promise.all([
      withRetry(() => rawQuery(
        `SELECT doctor_name, COUNT(*)::int AS total_shifts, COALESCE(SUM(CASE WHEN end_time IS NOT NULL THEN EXTRACT(EPOCH FROM (end_time - start_time)) / 60 ELSE 0 END)::int, 0) AS total_minutes, COALESCE(SUM(array_length(patients_treated, 1)), 0)::int AS total_patients_treated FROM doctor_sessions WHERE ${doctorDateWhere} GROUP BY doctor_name ORDER BY total_patients_treated DESC`,
        doctorValues
      )),
      withRetry(() => rawQuery(
        `SELECT DISTINCT doctor_name FROM doctor_sessions ORDER BY doctor_name`,
        []
      )),
    ]);

    result.doctor = {
      byDoctor: doctorSessions.map((r: Record<string, unknown>) => ({
        doctorName: r.doctor_name as string,
        totalShifts: Number(r.total_shifts),
        totalMinutes: Number(r.total_minutes),
        totalPatientsTreated: Number(r.total_patients_treated),
        avgPatientsPerShift: Number(r.total_shifts) > 0
          ? Math.round((Number(r.total_patients_treated) / Number(r.total_shifts)) * 10) / 10
          : 0,
      })),
      allStaff: allStaff.map((r: Record<string, unknown>) => r.doctor_name as string),
    };
  }

  return NextResponse.json(result);
}
