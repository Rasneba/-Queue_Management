import { NextRequest, NextResponse } from "next/server";
import { findPatient, recalculateWaitTimes } from "@/lib/store";

export async function POST(request: NextRequest) {
  const { id, triagePriority, recommendedDepartment, triageScore, priorityLevel } = await request.json();
  if (!id) {
    return NextResponse.json({ error: "Missing patient ID" }, { status: 400 });
  }

  const patient = findPatient(id);
  if (!patient) {
    return NextResponse.json({ error: "Patient not found" }, { status: 404 });
  }

  if (triagePriority) patient.triagePriority = triagePriority;
  if (recommendedDepartment) patient.recommendedDepartment = recommendedDepartment;
  if (triageScore) patient.triageScore = Number(triageScore);
  if (priorityLevel) patient.priorityLevel = priorityLevel;

  recalculateWaitTimes();
  return NextResponse.json(patient);
}
