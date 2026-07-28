import { NextRequest, NextResponse } from "next/server";
import { updatePatientReturning, scheduleRecalculate } from "@/lib/store";
import { notifyPatientsChanged } from "@/lib/realtime";

export async function POST(request: NextRequest) {
  const { id, triagePriority, recommendedDepartment, triageScore, priorityLevel } = await request.json();
  if (!id) {
    return NextResponse.json({ error: "Missing patient ID" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (triagePriority) updates.triagePriority = triagePriority;
  if (recommendedDepartment) updates.recommendedDepartment = recommendedDepartment;
  if (triageScore) updates.triageScore = Number(triageScore);
  if (priorityLevel) updates.priorityLevel = priorityLevel;

  const ok = await updatePatientReturning(id, updates);
  if (!ok) {
    return NextResponse.json({ error: "Patient not found" }, { status: 404 });
  }
  scheduleRecalculate();
  notifyPatientsChanged();
  return NextResponse.json({ ok: true });
}
