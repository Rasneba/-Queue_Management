import { NextResponse } from "next/server";
import { getPatients } from "@/lib/store";

export async function GET() {
  const patients = await getPatients();
  return NextResponse.json(patients);
}
