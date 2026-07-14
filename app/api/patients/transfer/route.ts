import { NextRequest, NextResponse } from "next/server";
import { findPatient, recalculateWaitTimes } from "@/lib/store";

export async function POST(request: NextRequest) {
  const { id, recommendedDepartment, assignedRoom, status } = await request.json();
  if (!id) {
    return NextResponse.json({ error: "Missing patient ID" }, { status: 400 });
  }

  const patient = findPatient(id);
  if (!patient) {
    return NextResponse.json({ error: "Patient not found" }, { status: 404 });
  }

  if (recommendedDepartment) {
    patient.recommendedDepartment = recommendedDepartment;
  }
  if (assignedRoom !== undefined) {
    patient.assignedRoom = assignedRoom;
  }
  if (status) {
    patient.status = status;
    if (status === 'Called') {
      patient.calledTime = new Date().toISOString();
    }
  } else {
    patient.status = "Waiting";
    patient.assignedRoom = null;
    patient.calledTime = null;
  }

  recalculateWaitTimes();
  return NextResponse.json(patient);
}
