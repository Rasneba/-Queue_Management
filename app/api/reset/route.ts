import { NextResponse } from "next/server";
import { resetStore, getPatients, runRecalculate } from "@/lib/store";
import { notifyPatientsChanged } from "@/lib/realtime";

export async function POST() {
  await resetStore();
  await runRecalculate();
  const patients = await getPatients();
  notifyPatientsChanged();
  return NextResponse.json({ message: "Queue database successfully reset", patients });
}
