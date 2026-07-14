import { Patient, Priority, Department } from "./types";

// In-memory clinic state
let patients: Patient[] = [
  {
    id: "P-1",
    name: "Ato Tesfaye Bekele",
    age: 58,
    gender: "Male",
    symptoms: "Crushing chest pain radiating to left arm, shortness of breath, and profuse sweating since morning",
    triagePriority: "Emergency",
    triageScore: 5,
    recommendedDepartment: "Cardiology",
    assignedRoom: "Trauma Room 2",
    status: "Serving",
    checkInTime: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    calledTime: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
    completedTime: null,
    estimatedWaitMinutes: 0,
    aiAnalysis: {
      priorityExplanation: "Symptoms strongly indicate acute coronary syndrome or myocardial infarction (heart attack). Requires immediate diagnostic ECG, cardiac enzyme profiling, and emergency medical intervention.",
      clinicalPrecaution: "Patient must not stand or walk. Administer supplemental oxygen if hypoxic, establish IV access, and monitor ECG continuously. Prepare defibrillator.",
      suggestedVitalsToMeasure: ["12-Lead Electrocardiogram (ECG)", "Blood Pressure (continuous)", "Oxygen Saturation (SpO2)"]
    }
  },
  {
    id: "P-2",
    name: "Sara Ahmed",
    age: 5,
    gender: "Female",
    symptoms: "High fever 39.5C for 2 days, coughing, refusing to eat, weak and lethargic",
    triagePriority: "High",
    triageScore: 4,
    recommendedDepartment: "Pediatrics",
    assignedRoom: "Room 4",
    status: "Called",
    checkInTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    calledTime: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    completedTime: null,
    estimatedWaitMinutes: 0,
    aiAnalysis: {
      priorityExplanation: "High fever with lethargy in a young child raises concern for serious infection including pneumonia, meningitis, or malaria. Requires urgent clinical assessment.",
      clinicalPrecaution: "Keep the child calm and comfortable. Monitor temperature closely. Ensure hydration. Have pediatric emergency equipment ready.",
      suggestedVitalsToMeasure: ["Body Temperature", "Respiratory Rate", "Oxygen Saturation (SpO2)"]
    }
  },
  {
    id: "P-3",
    name: "W/ro Hirut Mengistu",
    age: 45,
    gender: "Female",
    symptoms: "Sudden severe headache, worst of my life, with nausea and vomiting, stiff neck, sensitivity to light",
    triagePriority: "Emergency",
    triageScore: 5,
    recommendedDepartment: "Neurology",
    assignedRoom: "Trauma Room 1",
    status: "Serving",
    checkInTime: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    calledTime: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
    completedTime: null,
    estimatedWaitMinutes: 0,
    aiAnalysis: {
      priorityExplanation: "Thunderclap headache with meningismus is highly suspicious for subarachnoid hemorrhage or bacterial meningitis. Both are life-threatening emergencies.",
      clinicalPrecaution: "Immediate CT scan of the head. Avoid lumbar puncture until hemorrhage is excluded. Monitor neurological status closely. Prepare for possible neurosurgical intervention.",
      suggestedVitalsToMeasure: ["Blood Pressure", "Glasgow Coma Scale", "Pupil Reactivity"]
    }
  },
  {
    id: "P-4",
    name: "Ato Daniel Girma",
    age: 32,
    gender: "Male",
    symptoms: "Road traffic accident, fractured right femur, severe pain, leg shortened and externally rotated",
    triagePriority: "High",
    triageScore: 4,
    recommendedDepartment: "Orthopedics",
    assignedRoom: "Room 3",
    status: "Waiting",
    checkInTime: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    calledTime: null,
    completedTime: null,
    estimatedWaitMinutes: 15,
    aiAnalysis: {
      priorityExplanation: "Closed femoral fracture from road traffic accident. Risk of fat embolism, neurovascular compromise, and significant blood loss. Needs urgent orthopedic consultation.",
      clinicalPrecaution: "Apply skeletal traction or splint. Check distal pulses. Monitor for compartment syndrome. Cross-match blood. NPO in case surgery is needed.",
      suggestedVitalsToMeasure: ["Blood Pressure", "Heart Rate", "Distal Pulses", "Hemoglobin"]
    }
  },
  {
    id: "P-5",
    name: "W/ro Fatima Yusuf",
    age: 28,
    gender: "Female",
    symptoms: "8 months pregnant, severe headaches, blurred vision, swelling of face and hands, blood pressure 170/110",
    triagePriority: "High",
    triageScore: 4,
    recommendedDepartment: "Gynecology",
    assignedRoom: "Room 5",
    status: "Waiting",
    checkInTime: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    calledTime: null,
    completedTime: null,
    estimatedWaitMinutes: 12,
    aiAnalysis: {
      priorityExplanation: "Severe pre-eclampsia with concerning blood pressure readings. Risk of eclamptic seizure and HELLP syndrome. Requires immediate obstetric assessment.",
      clinicalPrecaution: "Administer magnesium sulfate prophylactically. Keep patient in left lateral position. Prepare for possible emergency cesarean section. Monitor fetal heart rate.",
      suggestedVitalsToMeasure: ["Blood Pressure (every 15 min)", "Urine Output", "Fetal Heart Rate", "Reflexes"]
    }
  },
  {
    id: "P-6",
    name: "Mulu Girma",
    age: 41,
    gender: "Female",
    symptoms: "Persistent cough for 3 weeks, night sweats, weight loss, occasional blood in sputum",
    triagePriority: "Medium",
    triageScore: 3,
    recommendedDepartment: "General Medicine",
    assignedRoom: null,
    status: "Waiting",
    checkInTime: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    calledTime: null,
    completedTime: null,
    estimatedWaitMinutes: 35,
    aiAnalysis: {
      priorityExplanation: "Chronic cough with hemoptysis, night sweats, and weight loss is highly suspicious for pulmonary tuberculosis, which is endemic in Ethiopia. Sputum AFB and chest X-ray required.",
      clinicalPrecaution: "Isolate patient. Use N95 mask. Collect 3 sputum samples for AFB smear and culture. Chest X-ray. Begin TB workup immediately.",
      suggestedVitalsToMeasure: ["Chest X-ray", "Sputum AFB", "HIV Test", "Weight"]
    }
  },
  {
    id: "P-7",
    name: "Ato Solomon Dinku",
    age: 72,
    gender: "Male",
    symptoms: "Prescription renewal for diabetes and hypertension, feeling fine, just routine check",
    triagePriority: "Low",
    triageScore: 1,
    recommendedDepartment: "General Medicine",
    assignedRoom: "Room 1",
    status: "Completed",
    checkInTime: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
    calledTime: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    completedTime: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    estimatedWaitMinutes: 0,
    aiAnalysis: {
      priorityExplanation: "Routine clinic consultation for chronic disease management (diabetes mellitus, hypertension). Patient is hemodynamically stable with no acute concerns.",
      clinicalPrecaution: "Confirm medication compliance, verify any reported side effects, check blood glucose and HbA1c. Conduct standard chronic disease clinic review.",
      suggestedVitalsToMeasure: ["Blood Pressure", "Fasting Blood Glucose", "Heart Rate", "Weight"]
    }
  }
];

let nextPatientNumber = 8;

const SEED_PATIENTS: Patient[] = JSON.parse(JSON.stringify(patients));

export function getPatients(): Patient[] {
  return patients;
}

export function setPatients(p: Patient[]) {
  patients = p;
}

export function findPatient(id: string): Patient | undefined {
  return patients.find(p => p.id === id);
}

export function getNextPatientNumber(): number {
  return nextPatientNumber++;
}

export function resetStore() {
  patients = JSON.parse(JSON.stringify(SEED_PATIENTS));
  nextPatientNumber = 8;
}

export function recalculateWaitTimes() {
  const waitingPatients = patients.filter(p => p.status === 'Waiting');

  const priorityLevelMap: Record<string, number> = {
    'VIP': 3,
    'Urgent': 2,
    'Standard': 1
  };

  const priorityMap: Record<Priority, number> = {
    'Emergency': 4,
    'High': 3,
    'Medium': 2,
    'Low': 1
  };

  waitingPatients.sort((a, b) => {
    const levelA = priorityLevelMap[a.priorityLevel || 'Standard'] || 1;
    const levelB = priorityLevelMap[b.priorityLevel || 'Standard'] || 1;
    if (levelA !== levelB) return levelB - levelA;

    const pA = priorityMap[a.triagePriority];
    const pB = priorityMap[b.triagePriority];
    if (pA !== pB) return pB - pA;
    if (b.triageScore !== a.triageScore) return b.triageScore - a.triageScore;
    return new Date(a.checkInTime).getTime() - new Date(b.checkInTime).getTime();
  });

  const deptCounters: Record<string, number> = {};

  patients.forEach(p => {
    if (p.status === 'Waiting') {
      const dept = p.recommendedDepartment;
      deptCounters[dept] = (deptCounters[dept] || 0) + 1;

      let baseMinutes = deptCounters[dept] * 12;
      if (p.triagePriority === 'Emergency') {
        p.estimatedWaitMinutes = 2;
      } else if (p.triagePriority === 'High') {
        p.estimatedWaitMinutes = Math.max(5, baseMinutes - 10);
      } else {
        p.estimatedWaitMinutes = baseMinutes;
      }
    } else {
      p.estimatedWaitMinutes = 0;
    }
  });
}

export function fallbackTriage(name: string, age: number, gender: string, symptoms: string) {
  const sym = symptoms.toLowerCase();
  let triagePriority: Priority = 'Low';
  let triageScore = 1;
  let recommendedDepartment: Department = 'General Medicine';
  let priorityExplanation = "";
  let clinicalPrecaution = "";
  let suggestedVitalsToMeasure = ["Blood Pressure", "Heart Rate", "Temperature"];

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

  return {
    triagePriority,
    triageScore,
    recommendedDepartment,
    priorityExplanation,
    clinicalPrecaution,
    suggestedVitalsToMeasure
  };
}
