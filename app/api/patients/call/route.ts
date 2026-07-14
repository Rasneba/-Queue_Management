import { NextRequest, NextResponse } from "next/server";
import { findPatient, recalculateWaitTimes } from "@/lib/store";

export async function POST(request: NextRequest) {
  const { id, room } = await request.json();
  if (!id || !room) {
    return NextResponse.json({ error: "Missing required body parameters: id, room" }, { status: 400 });
  }

  const patient = findPatient(id);
  if (!patient) {
    return NextResponse.json({ error: "Patient not found" }, { status: 404 });
  }

  patient.status = "Called";
  patient.assignedRoom = room;
  patient.calledTime = new Date().toISOString();

  recalculateWaitTimes();
  return NextResponse.json(patient);
}
