import { NextRequest, NextResponse } from "next/server";
import { createPatient, getNextPatientNumber, recalculateWaitTimes } from "@/lib/store";

export async function POST(request: NextRequest) {
  try {
    const { name, age, gender, symptoms, mobile, service, priorityLevel } = await request.json();
    if (!name) {
      return NextResponse.json({ error: "Missing required patient field: name" }, { status: 400 });
    }

    const patientAge = age !== undefined && age !== "" ? Number(age) : 30;
    const patientGender = gender || "Other";
    const patientSymptoms = symptoms || (service ? `Check-in for service: ${service}` : "General consultation");

    const patientNum = await getNextPatientNumber();
    const ticketId = `P-${patientNum}`;

    await createPatient({
      id: ticketId,
      name,
      age: patientAge,
      gender: patientGender,
      symptoms: patientSymptoms,
      triagePriority: "Low",
      triageScore: 1,
      recommendedDepartment: "General Medicine",
      status: "Waiting",
      estimatedWaitMinutes: 15,
      aiAnalysis: null,
      mobile,
      service: service || "General Medicine",
      priorityLevel: priorityLevel || "Standard",
    });

    await recalculateWaitTimes();

    return NextResponse.json({
      id: ticketId,
      name,
      age: patientAge,
      gender: patientGender,
      symptoms: patientSymptoms,
      triagePriority: "Low",
      triageScore: 1,
      recommendedDepartment: "General Medicine",
      assignedRoom: null,
      status: "Waiting",
      checkInTime: new Date().toISOString(),
      calledTime: null,
      completedTime: null,
      estimatedWaitMinutes: 15,
      aiAnalysis: null,
      mobile,
      service: service || "General Medicine",
      priorityLevel: priorityLevel || "Standard",
    }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "An error occurred during check-in";
    console.error("Check-in error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
