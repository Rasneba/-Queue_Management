import { NextRequest, NextResponse } from "next/server";
import { findPatient, recalculateWaitTimes } from "@/lib/store";

export async function POST(request: NextRequest) {
  const { id } = await request.json();
  if (!id) {
    return NextResponse.json({ error: "Missing patient ID" }, { status: 400 });
  }

  const patient = findPatient(id);
  if (!patient) {
    return NextResponse.json({ error: "Patient not found" }, { status: 404 });
  }

  patient.status = "Completed";
  patient.completedTime = new Date().toISOString();

  recalculateWaitTimes();
  return NextResponse.json(patient);
}
