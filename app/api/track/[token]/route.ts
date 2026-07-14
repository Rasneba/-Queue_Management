import { NextResponse } from "next/server";
import { getPatients } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const allPatients = getPatients();
  const patient = allPatients.find((p) => p.id === token);

  if (!patient) {
    return NextResponse.json({ error: "Token not found" }, { status: 404 });
  }

  const ahead = allPatients.filter(
    (p) =>
      p.status === "Waiting" &&
      p.recommendedDepartment === patient.recommendedDepartment &&
      new Date(p.checkInTime).getTime() < new Date(patient.checkInTime).getTime()
  ).length;

  const nowServing = allPatients.find(
    (p) =>
      p.status === "Serving" &&
      p.recommendedDepartment === patient.recommendedDepartment
  );

  return NextResponse.json({
    patient,
    position: patient.status === "Waiting" ? ahead + 1 : null,
    estimatedWait: patient.estimatedWaitMinutes,
    nowServing: nowServing?.id || null,
    peopleAhead: ahead,
  });
}
