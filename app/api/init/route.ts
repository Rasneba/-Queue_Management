import { NextResponse } from "next/server";
import { initDB, seedDB } from "@/lib/db";

export async function GET() {
  try {
    await initDB();
    await seedDB();
    return NextResponse.json({ ok: true, message: "Database initialized and seeded" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "DB init failed";
    console.error("DB init error:", err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
