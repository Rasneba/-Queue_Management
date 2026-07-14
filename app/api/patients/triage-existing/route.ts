import { NextRequest, NextResponse } from "next/server";
import { findPatient, recalculateWaitTimes, fallbackTriage } from "@/lib/store";

export async function POST(request: NextRequest) {
  try {
    const { id, symptoms } = await request.json();
    if (!id || !symptoms) {
      return NextResponse.json({ error: "Missing required parameters: id, symptoms" }, { status: 400 });
    }

    const patient = findPatient(id);
    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    const triageResult = fallbackTriage(patient.name, patient.age, patient.gender, symptoms);

    patient.symptoms = symptoms;
    patient.triagePriority = triageResult.triagePriority;
    patient.triageScore = triageResult.triageScore;
    patient.recommendedDepartment = triageResult.recommendedDepartment;
    patient.aiAnalysis = {
      priorityExplanation: triageResult.priorityExplanation,
      clinicalPrecaution: triageResult.clinicalPrecaution,
      suggestedVitalsToMeasure: triageResult.suggestedVitalsToMeasure
    };

    recalculateWaitTimes();
    return NextResponse.json(patient);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "An error occurred during triage";
    console.error("Triage-existing error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
