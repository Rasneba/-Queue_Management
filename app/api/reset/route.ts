import { NextResponse } from "next/server";
import { resetStore, getPatients, recalculateWaitTimes } from "@/lib/store";

export async function POST() {
  await resetStore();
  await recalculateWaitTimes();
  const patients = await getPatients();
  return NextResponse.json({ message: "Queue database successfully reset", patients });
}
