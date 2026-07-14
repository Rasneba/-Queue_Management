import { NextRequest, NextResponse } from "next/server";
import { findPatient, updatePatient, recalculateWaitTimes } from "@/lib/store";

export async function POST(request: NextRequest) {
  const { id, recommendedDepartment, assignedRoom, status } = await request.json();
  if (!id) {
    return NextResponse.json({ error: "Missing patient ID" }, { status: 400 });
  }

  const patient = await findPatient(id);
  if (!patient) {
    return NextResponse.json({ error: "Patient not found" }, { status: 404 });
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

  await updatePatient(id, updates);
  await recalculateWaitTimes();
  const updated = await findPatient(id);
  return NextResponse.json(updated);
}
