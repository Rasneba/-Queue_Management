import { Priority, Department } from "./types";
import sql from "./db";
import { Pool } from "@neondatabase/serverless";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function rowToPatient(row: Record<string, unknown>): {
  id: string; name: string; age: number; gender: string; symptoms: string;
  triagePriority: Priority; triageScore: number; recommendedDepartment: Department;
  assignedRoom: string | null; status: string; checkInTime: string;
  calledTime: string | null; completedTime: string | null;
  estimatedWaitMinutes: number; aiAnalysis: {
    priorityExplanation: string; clinicalPrecaution: string;
    suggestedVitalsToMeasure: string[];
  } | null;
  mobile?: string; service?: string;
  priorityLevel?: 'Standard' | 'Urgent' | 'VIP';
} {
  return {
    id: row.id as string,
    name: row.name as string,
    age: row.age as number,
    gender: row.gender as string,
    symptoms: row.symptoms as string,
    triagePriority: row.triage_priority as Priority,
    triageScore: row.triage_score as number,
    recommendedDepartment: row.recommended_department as Department,
    assignedRoom: row.assigned_room as string | null,
    status: row.status as string,
    checkInTime: row.check_in_time as string,
    calledTime: row.called_time as string | null,
    completedTime: row.completed_time as string | null,
    estimatedWaitMinutes: row.estimated_wait_minutes as number,
    aiAnalysis: row.ai_explanation ? {
      priorityExplanation: row.ai_explanation as string,
      clinicalPrecaution: row.ai_precaution as string,
      suggestedVitalsToMeasure: JSON.parse(row.ai_vitals as string || '[]'),
    } : null,
    mobile: row.mobile as string | undefined,
    service: row.service as string | undefined,
    priorityLevel: row.priority_level as 'Standard' | 'Urgent' | 'VIP' | undefined,
  };
}

export async function getPatients() {
  const rows = await sql`SELECT * FROM patients ORDER BY check_in_time ASC`;
  return rows.map(rowToPatient);
}

export async function findPatient(id: string) {
  const rows = await sql`SELECT * FROM patients WHERE id = ${id}`;
  return rows.length > 0 ? rowToPatient(rows[0]) : undefined;
}

export async function createPatient(data: {
  id: string; name: string; age: number; gender: string; symptoms: string;
  triagePriority: Priority; triageScore: number; recommendedDepartment: Department;
  status: string; estimatedWaitMinutes: number;
  aiAnalysis: { priorityExplanation: string; clinicalPrecaution: string; suggestedVitalsToMeasure: string[] } | null;
  mobile?: string; service?: string; priorityLevel?: string;
}) {
  await sql`
    INSERT INTO patients (id, name, age, gender, symptoms, triage_priority, triage_score, recommended_department, status, estimated_wait_minutes, ai_explanation, ai_precaution, ai_vitals, mobile, service, priority_level)
    VALUES (${data.id}, ${data.name}, ${data.age}, ${data.gender}, ${data.symptoms}, ${data.triagePriority}, ${data.triageScore}, ${data.recommendedDepartment}, ${data.status}, ${data.estimatedWaitMinutes}, ${data.aiAnalysis?.priorityExplanation || ''}, ${data.aiAnalysis?.clinicalPrecaution || ''}, ${JSON.stringify(data.aiAnalysis?.suggestedVitalsToMeasure || [])}, ${data.mobile || ''}, ${data.service || 'General Medicine'}, ${data.priorityLevel || 'Standard'})
  `;
}

export async function updatePatient(id: string, updates: Record<string, unknown>) {
  const fieldMap: Record<string, string> = {
    status: "status",
    assignedRoom: "assigned_room",
    calledTime: "called_time",
    completedTime: "completed_time",
    estimatedWaitMinutes: "estimated_wait_minutes",
    triagePriority: "triage_priority",
    triageScore: "triage_score",
    recommendedDepartment: "recommended_department",
    priorityLevel: "priority_level",
    symptoms: "symptoms",
    aiExplanation: "ai_explanation",
    aiPrecaution: "ai_precaution",
    aiVitals: "ai_vitals",
  };

  const entries = Object.entries(updates).filter(([key, val]) => val !== undefined && fieldMap[key]);
  if (entries.length === 0) return;

  let setClause = "";
  const values: unknown[] = [];
  let idx = 1;

  for (const [key, val] of entries) {
    if (idx > 1) setClause += ", ";
    setClause += `${fieldMap[key]} = $${idx}`;
    values.push(val);
    idx++;
  }

  values.push(id);
  await pool.query(`UPDATE patients SET ${setClause} WHERE id = $${idx}`, values);
}

export async function getNextPatientNumber(): Promise<number> {
  const result = await sql`
    UPDATE patient_counter SET next_number = next_number + 1 WHERE id = 1 RETURNING next_number
  `;
  return result[0].next_number;
}

export async function recalculateWaitTimes() {
  const waiting = await sql`SELECT id, recommended_department, triage_priority, triage_score, priority_level FROM patients WHERE status = 'Waiting' ORDER BY check_in_time ASC`;

  const priorityLevelMap: Record<string, number> = { 'VIP': 3, 'Urgent': 2, 'Standard': 1 };
  const priorityMap: Record<string, number> = { 'Emergency': 4, 'High': 3, 'Medium': 2, 'Low': 1 };

  const sorted = waiting.sort((a, b) => {
    const la = priorityLevelMap[(a.priority_level as string) || 'Standard'] || 1;
    const lb = priorityLevelMap[(b.priority_level as string) || 'Standard'] || 1;
    if (la !== lb) return lb - la;
    const pa = priorityMap[a.triage_priority as string] || 1;
    const pb = priorityMap[b.triage_priority as string] || 1;
    if (pa !== pb) return pb - pa;
    if (b.triage_score !== a.triage_score) return (b.triage_score as number) - (a.triage_score as number);
    return 0;
  });

  const deptCounters: Record<string, number> = {};
  for (const p of sorted) {
    const dept = p.recommended_department as string;
    deptCounters[dept] = (deptCounters[dept] || 0) + 1;
    let wait = deptCounters[dept] * 12;
    if (p.triage_priority === 'Emergency') wait = 2;
    else if (p.triage_priority === 'High') wait = Math.max(5, wait - 10);
    await sql`UPDATE patients SET estimated_wait_minutes = ${wait} WHERE id = ${p.id}`;
  }
}

export async function resetStore() {
  await sql`DELETE FROM patients`;
  await sql`UPDATE patient_counter SET next_number = 8 WHERE id = 1`;

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
}

export function fallbackTriage(name: string, age: number, gender: string, symptoms: string) {
  const sym = symptoms.toLowerCase();
  let triagePriority: Priority = 'Low';
  let triageScore = 1;
  let recommendedDepartment: Department = 'General Medicine';
  let priorityExplanation = "";
  let clinicalPrecaution = "";
  let suggestedVitalsToMeasure: string[] = ["Blood Pressure", "Heart Rate", "Temperature"];

  if (age <= 14 || sym.includes("child") || sym.includes("baby") || sym.includes("pediatric") || (sym.includes("fever") && age <= 16)) {
    recommendedDepartment = 'Pediatrics';
    suggestedVitalsToMeasure = ["Body Temperature", "Heart Rate", "Oxygen Saturation (SpO2)"];
  } else if (sym.includes("heart") || sym.includes("chest") || sym.includes("cardiac") || sym.includes("palpitation")) {
    recommendedDepartment = 'Cardiology';
    suggestedVitalsToMeasure = ["12-Lead ECG", "Blood Pressure", "Oxygen Saturation (SpO2)"];
  } else if (sym.includes("bone") || sym.includes("fracture") || sym.includes("break") || sym.includes("joint") || sym.includes("ankle") || sym.includes("fall") || sym.includes("wrist") || sym.includes("knee")) {
    recommendedDepartment = 'Orthopedics';
    suggestedVitalsToMeasure = ["Pain Scale (1-10)", "Capillary Refill", "Mobility Score"];
  } else if (sym.includes("headache") || sym.includes("stroke") || sym.includes("seizure") || sym.includes("numbness") || sym.includes("paralysis") || sym.includes("dizziness") || sym.includes("fainting")) {
    recommendedDepartment = 'Neurology';
    suggestedVitalsToMeasure = ["Glasgow Coma Scale", "Pupil Reactivity", "Blood Pressure"];
  } else if (sym.includes("pregnant") || sym.includes("pregnancy") || sym.includes("abdominal pain") && gender.toLowerCase() === "female") {
    recommendedDepartment = 'Gynecology';
    suggestedVitalsToMeasure = ["Blood Pressure", "Urine Protein", "Fundal Height"];
  } else if (sym.includes("cancer") || sym.includes("tumor") || sym.includes("chemotherapy") || sym.includes("lump")) {
    recommendedDepartment = 'Oncology';
    suggestedVitalsToMeasure = ["Weight", "Complete Blood Count", "Pain Assessment"];
  } else if (sym.includes("ear") || sym.includes("hearing") || sym.includes("nose") || sym.includes("throat") || sym.includes("sinus")) {
    recommendedDepartment = 'ENT';
    suggestedVitalsToMeasure = ["Otoscopy", "Temperature", "Throat Examination"];
  } else if (sym.includes("rash") || sym.includes("skin") || sym.includes("itching") || sym.includes("blister")) {
    recommendedDepartment = 'Dermatology';
    suggestedVitalsToMeasure = ["Skin Examination", "Temperature", "Allergy Assessment"];
  } else if (sym.includes("eye") || sym.includes("vision") || sym.includes("blurry") || sym.includes("blind")) {
    recommendedDepartment = 'Ophthalmology';
    suggestedVitalsToMeasure = ["Visual Acuity", "Intraocular Pressure", "Pupil Response"];
  } else if (sym.includes("severe bleeding") || sym.includes("unconscious") || sym.includes("anaphylaxis") || sym.includes("poison") || sym.includes("seizure") || sym.includes("accident") || sym.includes("gunshot") || sym.includes("suicidal")) {
    recommendedDepartment = 'Emergency';
    suggestedVitalsToMeasure = ["Airway status", "Oxygen Saturation (SpO2)", "Heart Rate"];
  }

  if (sym.includes("chest pain") || sym.includes("unconscious") || sym.includes("choking") || sym.includes("can't breathe") || sym.includes("heavy bleeding") || sym.includes("stroke")) {
    triagePriority = 'Emergency';
    triageScore = 5;
    priorityExplanation = "Immediate life-threatening presentation requiring instantaneous assessment and stabilization in trauma/resuscitation unit.";
    clinicalPrecaution = "Route immediately to emergency care. Have crash cart and defibrillator ready. Continuous cardiac monitoring.";
  } else if (sym.includes("severe") || sym.includes("high fever") || sym.includes("fracture") || sym.includes("breathing") || sym.includes("sudden") || sym.includes("sharp pain")) {
    triagePriority = 'High';
    triageScore = 4;
    priorityExplanation = "Urgent presentation with high potential for clinical deterioration or severe distress. Needs assessment within 15 minutes.";
    clinicalPrecaution = "Escort to nurse assessment area immediately. Monitor oxygen levels and administer immediate first-aid care.";
  } else if (sym.includes("fever") || sym.includes("cough") || sym.includes("vomiting") || sym.includes("pain") || sym.includes("swelling") || sym.includes("sprain")) {
    triagePriority = 'Medium';
    triageScore = 3;
    priorityExplanation = "Semi-urgent issue requiring diagnostic workup within a reasonable timeframe (30-60 mins) for symptomatic relief and treatment.";
    clinicalPrecaution = "Advise patient to sit quietly. Give isolation mask if respiratory symptoms. Re-assess if wait time exceeds 45 minutes.";
  } else {
    triagePriority = 'Low';
    triageScore = 2;
    priorityExplanation = "Non-urgent, medically stable presentation. Standard waiting times apply. Eligible for routing to general practitioner.";
    clinicalPrecaution = "Advise patient of estimated wait times. Instruct to report any new symptoms or deterioration instantly to reception.";
  }

  return { triagePriority, triageScore, recommendedDepartment, priorityExplanation, clinicalPrecaution, suggestedVitalsToMeasure };
}
