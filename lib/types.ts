export type Department = 'General Medicine' | 'Pediatrics' | 'Cardiology' | 'Orthopedics' | 'Emergency' | 'Neurology' | 'Oncology' | 'Gynecology' | 'Ophthalmology' | 'ENT' | 'Dermatology' | 'Radiology' | 'Laboratory' | 'Pharmacy';

export type Priority = 'Low' | 'Medium' | 'High' | 'Emergency';

export type PatientStatus = 'Waiting' | 'Called' | 'Serving' | 'Completed' | 'NoShow';

export interface AIAnalysis {
  priorityExplanation: string;
  clinicalPrecaution: string;
  suggestedVitalsToMeasure: string[];
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  symptoms: string;
  triagePriority: Priority;
  triageScore: number;
  recommendedDepartment: Department;
  assignedRoom: string | null;
  status: PatientStatus;
  checkInTime: string;
  calledTime: string | null;
  completedTime: string | null;
  estimatedWaitMinutes: number;
  aiAnalysis: AIAnalysis | null;
  mobile?: string;
  service?: string;
  priorityLevel?: 'Standard' | 'Urgent' | 'VIP';
}

export interface ClinicStats {
  totalWaiting: number;
  totalServedToday: number;
  averageWaitTimeMinutes: number;
  byDepartment: Record<Department, number>;
  byPriority: Record<Priority, number>;
  activeDoctorsCount: number;
}

export interface ShiftLog {
  id: string;
  doctorName: string;
  room: string;
  department: string;
  startTime: string;
  endTime: string | null;
  durationMinutes: number;
  patientsTreated: string[];
}
