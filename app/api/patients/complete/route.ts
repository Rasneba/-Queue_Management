import { NextRequest, NextResponse } from "next/server";
import { updatePatientReturning, scheduleRecalculate } from "@/lib/store";
import { notifyPatientsChanged } from "@/lib/realtime";

export async function POST(request: NextRequest) {
  const { id } = await request.json();
  if (!id) {
    return NextResponse.json({ error: "Missing patient ID" }, { status: 400 });
  }

  const ok = await updatePatientReturning(id, {
    status: "Completed",
    completedTime: new Date().toISOString(),
  });
  if (!ok) {
    return NextResponse.json({ error: "Patient not found" }, { status: 404 });
  }

  scheduleRecalculate();
  notifyPatientsChanged();
  return NextResponse.json({ ok: true });
}
