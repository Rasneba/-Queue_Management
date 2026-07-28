import { NextResponse } from "next/server";
import { rawQuery } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const patientRows = await rawQuery(
    `SELECT id, name, age, gender, symptoms, triage_priority, triage_score, recommended_department, assigned_room, status, check_in_time, called_time, completed_time, estimated_wait_minutes
     FROM patients WHERE id = $1`,
    [token]
  );

  if (patientRows.length === 0) {
    return NextResponse.json({ error: "Token not found" }, { status: 404 });
  }

  const p = patientRows[0] as Record<string, unknown>;
  const dept = p.recommended_department as string;
  const checkIn = p.check_in_time as string;

  const [aheadRows, servingRows] = await Promise.all([
    rawQuery(
      `SELECT COUNT(*)::int AS ahead FROM patients WHERE status='Waiting' AND recommended_department=$1 AND check_in_time < $2`,
      [dept, checkIn]
    ),
    rawQuery(
      `SELECT id FROM patients WHERE status='Serving' AND recommended_department=$1 LIMIT 1`,
      [dept]
    ),
  ]);

  const ahead = Number(aheadRows[0].ahead);

  const patient = {
    id: p.id as string,
    name: p.name as string,
    age: Number(p.age),
    gender: p.gender as string,
    symptoms: p.symptoms as string,
    triagePriority: p.triage_priority as string,
    triageScore: Number(p.triage_score),
    recommendedDepartment: dept,
    assignedRoom: (p.assigned_room as string | null) ?? null,
    status: p.status as string,
    checkInTime: checkIn,
    calledTime: (p.called_time as string | null) ?? null,
    completedTime: (p.completed_time as string | null) ?? null,
    estimatedWaitMinutes: Number(p.estimated_wait_minutes),
  };

  return NextResponse.json({
    patient,
    position: patient.status === "Waiting" ? ahead + 1 : null,
    estimatedWait: patient.estimatedWaitMinutes,
    nowServing: (servingRows[0]?.id as string) || null,
    peopleAhead: ahead,
  });
}
