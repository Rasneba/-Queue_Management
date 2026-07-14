import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export default sql;

export async function initDB() {
  await sql`
    CREATE TABLE IF NOT EXISTS patients (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      age INTEGER DEFAULT 30,
      gender TEXT DEFAULT 'Other',
      symptoms TEXT DEFAULT '',
      triage_priority TEXT DEFAULT 'Low',
      triage_score INTEGER DEFAULT 1,
      recommended_department TEXT DEFAULT 'General Medicine',
      assigned_room TEXT,
      status TEXT DEFAULT 'Waiting',
      check_in_time TIMESTAMPTZ DEFAULT NOW(),
      called_time TIMESTAMPTZ,
      completed_time TIMESTAMPTZ,
      estimated_wait_minutes INTEGER DEFAULT 15,
      ai_explanation TEXT DEFAULT '',
      ai_precaution TEXT DEFAULT '',
      ai_vitals TEXT DEFAULT '[]',
      mobile TEXT,
      service TEXT DEFAULT 'General Medicine',
      priority_level TEXT DEFAULT 'Standard'
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS patient_counter (
      id INTEGER PRIMARY KEY DEFAULT 1,
      next_number INTEGER DEFAULT 8
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS doctor_sessions (
      id TEXT PRIMARY KEY,
      doctor_name TEXT NOT NULL,
      room TEXT NOT NULL,
      department TEXT NOT NULL,
      start_time TIMESTAMPTZ DEFAULT NOW(),
      end_time TIMESTAMPTZ,
      is_active BOOLEAN DEFAULT TRUE,
      patients_treated TEXT[] DEFAULT '{}'
    );
  `;

  const result = await sql`SELECT COUNT(*)::int AS cnt FROM patient_counter`;
  if (result[0].cnt === 0) {
    await sql`INSERT INTO patient_counter (id, next_number) VALUES (1, 8)`;
  }
}

export async function getNextPatientNumber(): Promise<number> {
  const result = await sql`
    UPDATE patient_counter SET next_number = next_number + 1 WHERE id = 1 RETURNING next_number
  `;
  return result[0].next_number;
}

export async function seedDB() {
  const existing = await sql`SELECT COUNT(*)::int AS cnt FROM patients`;
  if (existing[0].cnt > 0) return;

  const seedPatients = [
    { id: "P-1", name: "Ato Tesfaye Bekele", age: 58, gender: "Male", symptoms: "Crushing chest pain radiating to left arm, shortness of breath, and profuse sweating since morning", priority: "Emergency", score: 5, dept: "Cardiology", room: "Trauma Room 2", status: "Serving", wait: 0 },
    { id: "P-2", name: "Sara Ahmed", age: 5, gender: "Female", symptoms: "High fever 39.5C for 2 days, coughing, refusing to eat, weak and lethargic", priority: "High", score: 4, dept: "Pediatrics", room: "Room 4", status: "Called", wait: 0 },
    { id: "P-3", name: "W/ro Hirut Mengistu", age: 45, gender: "Female", symptoms: "Sudden severe headache, worst of my life, with nausea and vomiting, stiff neck, sensitivity to light", priority: "Emergency", score: 5, dept: "Neurology", room: "Trauma Room 1", status: "Serving", wait: 0 },
    { id: "P-4", name: "Ato Daniel Girma", age: 32, gender: "Male", symptoms: "Road traffic accident, fractured right femur, severe pain, leg shortened and externally rotated", priority: "High", score: 4, dept: "Orthopedics", room: "Room 3", status: "Waiting", wait: 15 },
    { id: "P-5", name: "W/ro Fatima Yusuf", age: 28, gender: "Female", symptoms: "8 months pregnant, severe headaches, blurred vision, swelling of face and hands, blood pressure 170/110", priority: "High", score: 4, dept: "Gynecology", room: "Room 5", status: "Waiting", wait: 12 },
    { id: "P-6", name: "Mulu Girma", age: 41, gender: "Female", symptoms: "Persistent cough for 3 weeks, night sweats, weight loss, occasional blood in sputum", priority: "Medium", score: 3, dept: "General Medicine", room: null, status: "Waiting", wait: 35 },
    { id: "P-7", name: "Ato Solomon Dinku", age: 72, gender: "Male", symptoms: "Prescription renewal for diabetes and hypertension, feeling fine, just routine check", priority: "Low", score: 1, dept: "General Medicine", room: "Room 1", status: "Completed", wait: 0 },
  ];

  for (const p of seedPatients) {
    await sql`
      INSERT INTO patients (id, name, age, gender, symptoms, triage_priority, triage_score, recommended_department, assigned_room, status, estimated_wait_minutes)
      VALUES (${p.id}, ${p.name}, ${p.age}, ${p.gender}, ${p.symptoms}, ${p.priority}, ${p.score}, ${p.dept}, ${p.room}, ${p.status}, ${p.wait})
    `;
  }

  await sql`UPDATE patient_counter SET next_number = 8 WHERE id = 1`;
}
