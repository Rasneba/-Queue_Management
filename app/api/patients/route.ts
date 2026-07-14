import { NextResponse } from "next/server";
import { getPatients, recalculateWaitTimes } from "@/lib/store";

export async function GET() {
  recalculateWaitTimes();
  return NextResponse.json(getPatients());
}
