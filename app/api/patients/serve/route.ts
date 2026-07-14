import { NextRequest, NextResponse } from "next/server";
import { findPatient, updatePatient, recalculateWaitTimes } from "@/lib/store";

export async function POST(request: NextRequest) {
  const { id } = await request.json();
  if (!id) {
    return NextResponse.json({ error: "Missing patient ID" }, { status: 400 });
  }

  const patient = await findPatient(id);
  if (!patient) {
    return NextResponse.json({ error: "Patient not found" }, { status: 404 });
  }

  await updatePatient(id, { status: "Serving" });
  await recalculateWaitTimes();
  const updated = await findPatient(id);
  return NextResponse.json(updated);
}
