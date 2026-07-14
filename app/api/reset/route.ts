import { NextResponse } from "next/server";
import { resetStore, getPatients, recalculateWaitTimes } from "@/lib/store";

export async function POST() {
  resetStore();
  recalculateWaitTimes();
  return NextResponse.json({ message: "Queue database successfully reset", patients: getPatients() });
}
