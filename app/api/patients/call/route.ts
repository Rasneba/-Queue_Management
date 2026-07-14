import { NextRequest, NextResponse } from "next/server";
import { findPatient, updatePatient, recalculateWaitTimes } from "@/lib/store";

export async function POST(request: NextRequest) {
  const { id, room } = await request.json();
  if (!id || !room) {
    return NextResponse.json({ error: "Missing required body parameters: id, room" }, { status: 400 });
  }

  const patient = await findPatient(id);
  if (!patient) {
    return NextResponse.json({ error: "Patient not found" }, { status: 404 });
  }

  await updatePatient(id, {
    status: "Called",
    assignedRoom: room,
    calledTime: new Date().toISOString(),
  });

  await recalculateWaitTimes();
  const updated = await findPatient(id);
  return NextResponse.json(updated);
}
