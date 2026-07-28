import { Pool } from "pg";

const isNeon = !!(process.env.DATABASE_URL || "").includes("neon.tech");

const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        max: Number(process.env.PG_POOL_MAX) || 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
        ssl: isNeon ? { rejectUnauthorized: false } : false,
      }
    : {
        host: process.env.PGHOST || "localhost",
        port: Number(process.env.PGPORT) || 5432,
        database: process.env.PGDATABASE || "queue_management",
        user: process.env.PGUSER || "postgres",
        password: process.env.PGPASSWORD || "123456",
        max: Number(process.env.PG_POOL_MAX) || 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      }
);

export { pool };

pool.on("error", (err) => {
  console.error("[db] Unexpected pool error:", err.message);
});

let poolReady = false;
async function ensurePoolConnection(): Promise<void> {
  if (poolReady) return;
  try {
    const client = await pool.connect();
    client.release();
    poolReady = true;
  } catch (err) {
    console.error("[db] Initial pool connection failed, retrying in 2s:", (err as Error).message);
    await new Promise(r => setTimeout(r, 2000));
    const client = await pool.connect();
    client.release();
    poolReady = true;
  }
}

let migrationsRun = false;
let migrationsPromise: Promise<void> | null = null;

async function ensureMigrations() {
  if (migrationsRun) return;
  if (migrationsPromise) return migrationsPromise;
  migrationsPromise = (async () => {
    try {
      await pool.query("SELECT 1 FROM patients LIMIT 1");
      await pool.query("ALTER TABLE staff ADD COLUMN IF NOT EXISTS desk TEXT");
      await pool.query("ALTER TABLE staff ADD COLUMN IF NOT EXISTS category TEXT DEFAULT ''");
      await pool.query(`CREATE TABLE IF NOT EXISTS system_settings (
        id SERIAL PRIMARY KEY,
        category TEXT NOT NULL CHECK (category IN ('department', 'role')),
        name TEXT NOT NULL UNIQUE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )`);
      await Promise.all([
        (async () => {
          const deptCount = await pool.query("SELECT COUNT(*)::int AS cnt FROM system_settings WHERE category = 'department'");
          if (deptCount.rows[0].cnt === 0) {
            const defaults = ['General Medicine','Pediatrics','Cardiology','Orthopedics','Emergency','Neurology','Oncology','Gynecology','Ophthalmology','ENT','Dermatology','Radiology','Laboratory','Pharmacy'];
            await pool.query("INSERT INTO system_settings (category, name) SELECT 'department', unnest($1::text[]) ON CONFLICT (name) DO NOTHING", [defaults]);
          }
        })(),
        (async () => {
          const roleCount = await pool.query("SELECT COUNT(*)::int AS cnt FROM system_settings WHERE category = 'role'");
          if (roleCount.rows[0].cnt === 0) {
            const defaults = ['Reception','Triage','Doctor','Admin'];
            await pool.query("INSERT INTO system_settings (category, name) SELECT 'role', unnest($1::text[]) ON CONFLICT (name) DO NOTHING", [defaults]);
          }
        })(),
        (async () => {
          const res = await pool.query("SELECT id FROM staff WHERE name = 'Admin' AND role = 'Admin' LIMIT 1");
          if (res.rows.length === 0) {
            await pool.query("INSERT INTO staff (id, name, role, password, department) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO NOTHING", ['staff_admin', 'Admin', 'Admin', 'admin123', 'General Medicine']);
          }
        })(),
      ]);
      await seedStaff();
      console.log("[db] Migrations complete.");
    } catch (err) {
      if ((err as Error).message.includes('relation "patients" does not exist')) {
        console.log("[db] Tables not found, initializing...");
        await initDB();
        await seedDB();
        console.log("[db] Tables created and seeded.");
      } else {
        console.error("[db] Migration error:", (err as Error).message);
      }
    } finally {
      migrationsRun = true;
      migrationsPromise = null;
    }
  })();
  return migrationsPromise;
}

let queryReady = false;

async function query(text: string, params?: unknown[]): Promise<Record<string, unknown>[]> {
  if (!queryReady) {
    await ensurePoolConnection();
    queryReady = true;
    await ensureMigrations();
  }
  const result = await pool.query(text, params || []);
  return result.rows as Record<string, unknown>[];
}

function sqlTag(strings: TemplateStringsArray, ...values: unknown[]): Promise<Record<string, unknown>[]> {
  let text = "";
  let paramIndex = 0;
  for (let i = 0; i < strings.length; i++) {
    text += strings[i];
    if (i < values.length) {
      if (values[i] && typeof values[i] === 'object' && (values[i] as Record<string, unknown>).__raw) {
        text += (values[i] as { value: string }).value;
      } else {
        paramIndex++;
        text += `$${paramIndex}`;
      }
    }
  }
  const params = values.filter((v) => !(v && typeof v === 'object' && (v as Record<string, unknown>).__raw)).map((v) => v === undefined ? null : v);
  return query(text, params);
}

sqlTag.raw = (value: string) => ({ __raw: true, value });

const sql = Object.assign(sqlTag, { query, raw: sqlTag.raw });

export default sql;

async function withRetry<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      const msg = (err as Error).message;
      const isTransient = msg.includes('timeout') || msg.includes('ECONNRESET') || msg.includes('connection terminated') || msg.includes('pool exhausted') || msg.includes('too many clients');
      console.error(`DB attempt ${i + 1} failed:`, msg);
      if (i === retries - 1 || !isTransient) throw err;
      await new Promise(r => setTimeout(r, delay * (i + 1)));
    }
  }
  throw new Error("Unreachable");
}

export { withRetry };

export async function rawQuery(queryStr: string, values: unknown[] = []) {
  return query(queryStr, values);
}

export async function initDB() {
  await withRetry(() => sql`
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
    )
  `);

  await withRetry(() => sql`
    CREATE TABLE IF NOT EXISTS patient_counter (
      id INTEGER PRIMARY KEY DEFAULT 1,
      next_number INTEGER DEFAULT 8
    )
  `);

  await withRetry(() => sql`
    CREATE TABLE IF NOT EXISTS doctor_sessions (
      id TEXT PRIMARY KEY,
      doctor_name TEXT NOT NULL,
      room TEXT NOT NULL,
      department TEXT NOT NULL,
      start_time TIMESTAMPTZ DEFAULT NOW(),
      end_time TIMESTAMPTZ,
      is_active BOOLEAN DEFAULT TRUE,
      patients_treated TEXT[] DEFAULT '{}'
    )
  `);

  await withRetry(() => sql`
    CREATE TABLE IF NOT EXISTS staff (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('Reception', 'Triage', 'Doctor', 'Admin')),
      password TEXT NOT NULL,
      department TEXT DEFAULT 'General Medicine',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      is_active BOOLEAN DEFAULT TRUE,
      desk TEXT,
      category TEXT DEFAULT ''
    )
  `);

  try {
    await withRetry(() => sql`ALTER TABLE staff ADD COLUMN IF NOT EXISTS desk TEXT`);
  } catch { /* column may already exist */ }

  const result = await withRetry(() => sql`SELECT COUNT(*)::int AS cnt FROM patient_counter`);
  if (Number(result[0].cnt) === 0) {
    await withRetry(() => sql`INSERT INTO patient_counter (id, next_number) VALUES (1, 8)`);
  }

  await withRetry(() => sql`CREATE INDEX IF NOT EXISTS idx_patients_status ON patients(status)`);
  await withRetry(() => sql`CREATE INDEX IF NOT EXISTS idx_patients_checkin ON patients(check_in_time)`);
  await withRetry(() => sql`CREATE INDEX IF NOT EXISTS idx_patients_dept ON patients(recommended_department)`);
  await withRetry(() => sql`CREATE INDEX IF NOT EXISTS idx_patients_id ON patients(id)`);
  await withRetry(() => sql`CREATE INDEX IF NOT EXISTS idx_patients_triage ON patients(triage_priority, triage_score)`);
  await withRetry(() => sql`CREATE INDEX IF NOT EXISTS idx_patients_priority ON patients(priority_level)`);
  await withRetry(() => sql`CREATE INDEX IF NOT EXISTS idx_doctor_sessions_active ON doctor_sessions(is_active)`);
  await withRetry(() => sql`CREATE INDEX IF NOT EXISTS idx_doctor_sessions_doctor ON doctor_sessions(doctor_name)`);
  await withRetry(() => sql`CREATE INDEX IF NOT EXISTS idx_staff_role ON staff(role)`);
  await withRetry(() => sql`CREATE INDEX IF NOT EXISTS idx_staff_name_active ON staff(name, is_active)`);
  await withRetry(() => sql`CREATE INDEX IF NOT EXISTS idx_staff_desk ON staff(desk)`);
  await withRetry(() => sql`CREATE INDEX IF NOT EXISTS idx_patients_dept_status_checkin ON patients(recommended_department, status, check_in_time)`);
  await withRetry(() => sql`CREATE INDEX IF NOT EXISTS idx_patients_status_assigned ON patients(status, assigned_room)`);
  await withRetry(() => sql`CREATE INDEX IF NOT EXISTS idx_doctor_sessions_end ON doctor_sessions(end_time)`);

  await withRetry(() => sql`
    CREATE TABLE IF NOT EXISTS system_settings (
      id SERIAL PRIMARY KEY,
      category TEXT NOT NULL CHECK (category IN ('department', 'role')),
      name TEXT NOT NULL UNIQUE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}

export async function getNextPatientNumber(): Promise<number> {
  const result = await withRetry(() => sql`
    UPDATE patient_counter SET next_number = next_number + 1 WHERE id = 1 RETURNING next_number
  `);
  return Number(result[0].next_number);
}

// Ethiopian demo staff so the system is usable immediately after reset/seed.
const SEED_STAFF = [
  { id: "staff_doc_1", name: "Dr. Abebe Kebede", role: "Doctor", password: "doctor123", department: "General Medicine", category: "Physician" },
  { id: "staff_doc_2", name: "Dr. Tigist Haile", role: "Doctor", password: "doctor123", department: "Pediatrics", category: "Physician" },
  { id: "staff_doc_3", name: "Dr. Daniel Bekele", role: "Doctor", password: "doctor123", department: "Cardiology", category: "Physician" },
  { id: "staff_doc_4", name: "Dr. Hana Lemma", role: "Doctor", password: "doctor123", department: "Orthopedics", category: "Surgeon" },
  { id: "staff_rec_1", name: "Rahel Tadesse", role: "Reception", password: "recept123", department: "General Medicine", desk: "Desk 1" },
  { id: "staff_rec_2", name: "Bereket Solomon", role: "Reception", password: "recept123", department: "General Medicine", desk: "Desk 2" },
  { id: "staff_tri_1", name: "Senait Mulugeta", role: "Triage", password: "triage123", department: "Emergency", desk: null },
  { id: "staff_admin", name: "Admin", role: "Admin", password: "admin123", department: "General Medicine", desk: null },
];

export async function seedStaff() {
  for (const s of SEED_STAFF) {
    await withRetry(() => sql`
      INSERT INTO staff (id, name, role, password, department, is_active, desk, category)
      VALUES (${s.id}, ${s.name}, ${s.role}, ${s.password}, ${s.department}, TRUE, ${s.desk ?? null}, ${s.category})
      ON CONFLICT (id) DO NOTHING
    `);
  }
}

export async function seedDB() {
  await seedStaff();

  const existing = await withRetry(() => sql`SELECT COUNT(*)::int AS cnt FROM patients`);
  if (Number(existing[0].cnt) > 0) {
    await withRetry(() => sql`UPDATE patient_counter SET next_number = 8 WHERE id = 1`);
    return;
  }

  const seedPatients = [
    { id: "P-1", name: "Ato Tesfaye Bekele", age: 58, gender: "Male", symptoms: "Crushing chest pain radiating to left arm, shortness of breath, and profuse sweating since morning", priority: "Emergency", score: 5, dept: "Cardiology", room: "Trauma Room 2", status: "Serving", wait: 0 },
    { id: "P-2", name: "Sara Ahmed", age: 5, gender: "Female", symptoms: "High fever 39.5C for 2 days, coughing, refusing to eat, weak and lethargic", priority: "High", score: 4, dept: "Pediatrics", room: "Room 4", status: "Called", wait: 0 },
    { id: "P-3", name: "W/ro Hirut Mengistu", age: 45, gender: "Female", symptoms: "Sudden severe headache, worst of my life, with nausea and vomiting, stiff neck, sensitivity to light", priority: "Emergency", score: 5, dept: "Neurology", room: "Trauma Room 1", status: "Serving", wait: 0 },
    { id: "P-4", name: "Ato Daniel Girma", age: 32, gender: "Male", symptoms: "Road traffic accident, fractured right femur, severe pain, leg shortened and externally rotated", priority: "High", score: 4, dept: "Orthopedics", room: "Room 3", status: "Waiting", wait: 15 },
    { id: "P-5", name: "W/ro Fatima Yusuf", age: 28, gender: "Female", symptoms: "8 months pregnant, severe headaches, blurred vision, swelling of face and hands, blood pressure 170/110", priority: "High", score: 4, dept: "Gynecology", room: "Room 5", status: "Waiting", wait: 12 },
    { id: "P-6", name: "Mulu Girma", age: 41, gender: "Female", symptoms: "Persistent cough for 3 weeks, night sweats, weight loss, occasional blood in sputum", priority: "Medium", score: 3, dept: "General Medicine", room: null, status: "Waiting", wait: 35 },
    { id: "P-7", name: "Ato Solomon Dinku", age: 72, gender: "Male", symptoms: "Prescription renewal for diabetes and hypertension, feeling fine, just routine check", priority: "Low", score: 1, dept: "General Medicine", room: "Room 1", status: "Completed", wait: 0 },
    { id: "P-8", name: "Etenesh Bekele", age: 24, gender: "Female", symptoms: "Severe abdominal pain lower right side, nausea, fever 38C", priority: "High", score: 4, dept: "Emergency", room: null, status: "Waiting", wait: 20 },
    { id: "P-9", name: "Yonas Getachew", age: 47, gender: "Male", symptoms: "Dizziness and blurred vision for two days, known hypertensive", priority: "Medium", score: 3, dept: "General Medicine", room: null, status: "Waiting", wait: 28 },
    { id: "P-10", name: "Kedir Abdela", age: 9, gender: "Male", symptoms: "Ear pain and fever, tugging at ear, irritable", priority: "Medium", score: 3, dept: "Pediatrics", room: null, status: "Waiting", wait: 33 },
  ];

  for (const p of seedPatients) {
    await withRetry(() => sql`
      INSERT INTO patients (id, name, age, gender, symptoms, triage_priority, triage_score, recommended_department, assigned_room, status, estimated_wait_minutes)
      VALUES (${p.id}, ${p.name}, ${p.age}, ${p.gender}, ${p.symptoms}, ${p.priority}, ${p.score}, ${p.dept}, ${p.room}, ${p.status}, ${p.wait})
    `);
  }

  await withRetry(() => sql`UPDATE patient_counter SET next_number = 11 WHERE id = 1`);
}
