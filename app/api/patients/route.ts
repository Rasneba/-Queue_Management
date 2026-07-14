import { NextResponse } from "next/server";
import { getPatients, recalculateWaitTimes } from "@/lib/store";

export async function GET() {
  await recalculateWaitTimes();
  const patients = await getPatients();
  return NextResponse.json(patients);
}
