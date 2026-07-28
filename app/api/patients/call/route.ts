import { NextRequest, NextResponse } from "next/server";
import { updatePatientReturning } from "@/lib/store";
import { notifyPatientsChanged } from "@/lib/realtime";

export async function POST(request: NextRequest) {
  const { id, room } = await request.json();
  if (!id || !room) {
    return NextResponse.json({ error: "Missing required body parameters: id, room" }, { status: 400 });
  }

  const ok = await updatePatientReturning(id, {
    status: "Called",
    assignedRoom: room,
    calledTime: new Date().toISOString(),
  });
  if (!ok) {
    return NextResponse.json({ error: "Patient not found" }, { status: 404 });
  }

  notifyPatientsChanged();
  return NextResponse.json({ ok: true });
}
