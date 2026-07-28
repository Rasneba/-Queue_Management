import { NextResponse } from "next/server";
import { getPatients, getActivePatients } from "@/lib/store";

export async function GET(req: Request) {
  try {
    const active = new URL(req.url).searchParams.get("active") === "true";
    const patients = active ? await getActivePatients() : await getPatients();
    return NextResponse.json(patients, {
      headers: {
        'Cache-Control': 'private, max-age=5, stale-while-revalidate=10',
      },
    });
  } catch (err) {
    console.error("Failed to fetch patients:", err);
    return NextResponse.json({ error: "Database connection failed" }, { status: 503 });
  }
}
