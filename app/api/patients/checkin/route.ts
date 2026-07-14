import { NextRequest, NextResponse } from "next/server";
import { Patient, Priority, Department } from "@/lib/types";
import { getPatients, getNextPatientNumber, recalculateWaitTimes, fallbackTriage } from "@/lib/store";

export async function POST(request: NextRequest) {
  try {
    const { name, age, gender, symptoms, mobile, service, priorityLevel } = await request.json();
    if (!name) {
      return NextResponse.json({ error: "Missing required patient field: name" }, { status: 400 });
    }

    const patientAge = age !== undefined && age !== "" ? Number(age) : 30;
    const patientGender = gender || "Other";
    const patientSymptoms = symptoms || (service ? `Check-in for service: ${service}` : "General consultation");

    let triagePriority: Priority = "Low";
    let triageScore = 1;
    let recommendedDepartment: Department = "General Medicine";
    let priorityExplanation = "Standard arrival queue.";
    let clinicalPrecaution = "";
    let suggestedVitalsToMeasure: string[] = ["Blood Pressure", "Heart Rate"];

    const isRegistration = service === "Registration" || service === "Reception";

    if (!isRegistration) {
      const triageResult = fallbackTriage(name, patientAge, patientGender, patientSymptoms);
      triagePriority = triageResult.triagePriority;
      triageScore = triageResult.triageScore;
      recommendedDepartment = triageResult.recommendedDepartment;
      priorityExplanation = triageResult.priorityExplanation;
      clinicalPrecaution = triageResult.clinicalPrecaution;
      suggestedVitalsToMeasure = triageResult.suggestedVitalsToMeasure;
    } else {
      priorityExplanation = "Administrative registration service.";
      clinicalPrecaution = "Verify administrative details and contact information.";
    }

    const patientNum = getNextPatientNumber();
    const ticketId = `P-${patientNum}`;

    const newPatient: Patient = {
      id: ticketId,
      name,
      age: patientAge,
      gender: patientGender,
      symptoms: patientSymptoms,
      triagePriority,
      triageScore,
      recommendedDepartment,
      assignedRoom: null,
      status: "Waiting",
      checkInTime: new Date().toISOString(),
      calledTime: null,
      completedTime: null,
      estimatedWaitMinutes: 15,
      aiAnalysis: { priorityExplanation, clinicalPrecaution, suggestedVitalsToMeasure },
      mobile,
      service: service || "General Medicine",
      priorityLevel: priorityLevel || "Standard"
    };

    const patients = getPatients();
    patients.push(newPatient);
    recalculateWaitTimes();

    return NextResponse.json(newPatient, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "An error occurred during triage and check-in";
    console.error("Check-in error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
