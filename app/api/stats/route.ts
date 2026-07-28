import { NextResponse } from "next/server";
import { withRetry, rawQuery } from "@/lib/db";
import { Department, Priority } from "@/lib/types";

export async function GET() {
  const [countsRows, avgWaitRows, deptRows, priorityRows, activeDoctorRows] = await Promise.all([
    withRetry(() => rawQuery(`
      SELECT
        COUNT(*) FILTER (WHERE status IN ('Waiting','Called'))::int AS waiting,
        COUNT(*) FILTER (WHERE status = 'Completed')::int AS completed
      FROM patients
    `)),
    withRetry(() => rawQuery(`
      SELECT COALESCE(
        AVG(EXTRACT(EPOCH FROM (called_time - check_in_time)) / 60)::int, 18
      ) AS avg_wait
      FROM patients
      WHERE status = 'Completed' AND called_time IS NOT NULL AND check_in_time IS NOT NULL
    `)),
    withRetry(() => rawQuery(`
      SELECT recommended_department, COUNT(*)::int AS cnt
      FROM patients
      WHERE status IN ('Waiting', 'Called', 'Serving')
      GROUP BY recommended_department
    `)),
    withRetry(() => rawQuery(`
      SELECT triage_priority, COUNT(*)::int AS cnt
      FROM patients
      WHERE status IN ('Waiting', 'Called', 'Serving')
      GROUP BY triage_priority
    `)),
    withRetry(() => rawQuery(`SELECT COUNT(*)::int AS cnt FROM doctor_sessions WHERE is_active = TRUE`)),
  ]);

  const totalWaiting = Number(countsRows[0]?.waiting ?? 0);
  const totalServedToday = Number(countsRows[0]?.completed ?? 0);
  const averageWaitTimeMinutes = Number(avgWaitRows[0]?.avg_wait ?? 18);
  const activeDoctorsCount = Number(activeDoctorRows[0]?.cnt ?? 0);

  const byDepartment: Record<Department, number> = {
    'General Medicine': 0, 'Pediatrics': 0, 'Cardiology': 0,
    'Orthopedics': 0, 'Emergency': 0, 'Neurology': 0,
    'Oncology': 0, 'Gynecology': 0, 'Ophthalmology': 0,
    'ENT': 0, 'Dermatology': 0, 'Radiology': 0,
    'Laboratory': 0, 'Pharmacy': 0,
  };
  for (const row of deptRows) {
    const dept = row.recommended_department as Department;
    if (dept in byDepartment) byDepartment[dept] = Number(row.cnt);
  }

  const byPriority: Record<Priority, number> = {
    'Low': 0, 'Medium': 0, 'High': 0, 'Emergency': 0,
  };
  for (const row of priorityRows) {
    const pri = row.triage_priority as Priority;
    if (pri in byPriority) byPriority[pri] = Number(row.cnt);
  }

  return NextResponse.json({
    totalWaiting,
    totalServedToday,
    averageWaitTimeMinutes,
    byDepartment,
    byPriority,
    activeDoctorsCount,
  });
}
