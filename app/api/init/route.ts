import { NextResponse } from "next/server";
import { initDB, seedDB } from "@/lib/db";
import sql from "@/lib/db";

export async function GET() {
  try {
    await initDB();
    await seedDB();

    const existingAdmin = await sql`SELECT id FROM staff WHERE name = 'Admin' AND role = 'Doctor' LIMIT 1`;
    if (existingAdmin.length === 0) {
      await sql`
        INSERT INTO staff (id, name, role, password, department)
        VALUES ('staff_admin', 'Admin', 'Doctor', 'admin123', 'General Medicine')
      `;
    }

    return NextResponse.json({ ok: true, message: "Database initialized and seeded" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "DB init failed";
    console.error("DB init error:", err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
