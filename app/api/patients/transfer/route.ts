import { NextRequest, NextResponse } from "next/server";
import { updatePatientReturning, scheduleRecalculate } from "@/lib/store";
import { notifyPatientsChanged } from "@/lib/realtime";

export async function POST(request: NextRequest) {
  const { id, recommendedDepartment, assignedRoom, status } = await request.json();
  if (!id) {
    return NextResponse.json({ error: "Missing patient ID" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (recommendedDepartment) updates.recommendedDepartment = recommendedDepartment;
  if (assignedRoom !== undefined) updates.assignedRoom = assignedRoom;
  if (status) {
    updates.status = status;
    if (status === "Called") updates.calledTime = new Date().toISOString();
  } else {
    updates.status = "Waiting";
    updates.assignedRoom = null;
    updates.calledTime = null;
  }

  const ok = await updatePatientReturning(id, updates);
  if (!ok) {
    return NextResponse.json({ error: "Patient not found" }, { status: 404 });
  }
  scheduleRecalculate();
  notifyPatientsChanged();
  return NextResponse.json({ ok: true });
}
