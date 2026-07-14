import { NextRequest, NextResponse } from "next/server";
import { findPatient, updatePatient, recalculateWaitTimes, fallbackTriage } from "@/lib/store";

export async function POST(request: NextRequest) {
  try {
    const { id, symptoms } = await request.json();
    if (!id || !symptoms) {
      return NextResponse.json({ error: "Missing required parameters: id, symptoms" }, { status: 400 });
    }

    const patient = await findPatient(id);
    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    const triageResult = fallbackTriage(patient.name, patient.age, patient.gender, symptoms);

    await updatePatient(id, {
      symptoms,
      triagePriority: triageResult.triagePriority,
      triageScore: triageResult.triageScore,
      recommendedDepartment: triageResult.recommendedDepartment,
      aiExplanation: triageResult.priorityExplanation,
      aiPrecaution: triageResult.clinicalPrecaution,
      aiVitals: JSON.stringify(triageResult.suggestedVitalsToMeasure),
    });

    await recalculateWaitTimes();
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "An error occurred during triage";
    console.error("Triage-existing error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
