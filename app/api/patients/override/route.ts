import { NextRequest, NextResponse } from "next/server";
import { findPatient, updatePatient, recalculateWaitTimes } from "@/lib/store";

export async function POST(request: NextRequest) {
  const { id, triagePriority, recommendedDepartment, triageScore, priorityLevel } = await request.json();
  if (!id) {
    return NextResponse.json({ error: "Missing patient ID" }, { status: 400 });
  }

  const patient = await findPatient(id);
  if (!patient) {
    return NextResponse.json({ error: "Patient not found" }, { status: 404 });
  }

  const updates: Record<string, unknown> = {};
  if (triagePriority) updates.triagePriority = triagePriority;
  if (recommendedDepartment) updates.recommendedDepartment = recommendedDepartment;
  if (triageScore) updates.triageScore = Number(triageScore);
  if (priorityLevel) updates.priorityLevel = priorityLevel;

  await updatePatient(id, updates);
  await recalculateWaitTimes();
  return NextResponse.json({ ok: true });
}
