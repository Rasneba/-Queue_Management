import { NextResponse } from "next/server";
import { initDB, seedDB } from "@/lib/db";
import sql from "@/lib/db";

export async function GET() {
  try {
    await initDB();
    await seedDB();

    try {
      await sql`ALTER TABLE staff ADD CONSTRAINT staff_role_check_v2 CHECK (role IN ('Reception', 'Triage', 'Doctor', 'Admin'))`;
    } catch {
      try {
        await sql`DROP TABLE IF EXISTS staff CASCADE`;
        await sql`
          CREATE TABLE staff (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            role TEXT NOT NULL CHECK (role IN ('Reception', 'Triage', 'Doctor', 'Admin')),
            password TEXT NOT NULL,
            department TEXT DEFAULT 'General Medicine',
            created_at TIMESTAMPTZ DEFAULT NOW(),
            is_active BOOLEAN DEFAULT TRUE
          )
        `;
      } catch {
        return NextResponse.json({ ok: false, error: "Staff table migration failed" }, { status: 500 });
      }
    }

    const existingAdmin = await sql`SELECT id FROM staff WHERE name = 'Admin' AND role = 'Admin' LIMIT 1`;
    if (existingAdmin.length === 0) {
      await sql`DELETE FROM staff WHERE name = 'Admin'`;
      await sql`
        INSERT INTO staff (id, name, role, password, department)
        VALUES ('staff_admin', 'Admin', 'Admin', 'admin123', 'General Medicine')
      `;
    }

    return NextResponse.json({ ok: true, message: "Database initialized and seeded" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "DB init failed";
    console.error("DB init error:", err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
