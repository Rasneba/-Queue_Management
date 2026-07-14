import { NextResponse } from "next/server";
import { getPatients, recalculateWaitTimes } from "@/lib/store";
import { Department, Priority } from "@/lib/types";

export async function GET() {
  await recalculateWaitTimes();
  const patients = await getPatients();

  const waiting = patients.filter(p => p.status === 'Waiting');
  const called = patients.filter(p => p.status === 'Called');
  const completed = patients.filter(p => p.status === 'Completed');

  let totalWaitTime = 0;
  let countCompleted = 0;

  completed.forEach(p => {
    if (p.calledTime && p.checkInTime) {
      const waitMs = new Date(p.calledTime).getTime() - new Date(p.checkInTime).getTime();
      totalWaitTime += Math.floor(waitMs / (60 * 1000));
      countCompleted++;
    }
  });

  const avgWait = countCompleted > 0 ? Math.round(totalWaitTime / countCompleted) : 18;

  const byDepartment: Record<Department, number> = {
    'General Medicine': 0,
    'Pediatrics': 0,
    'Cardiology': 0,
    'Orthopedics': 0,
    'Emergency': 0,
    'Neurology': 0,
    'Oncology': 0,
    'Gynecology': 0,
    'Ophthalmology': 0,
    'ENT': 0,
    'Dermatology': 0,
    'Radiology': 0,
    'Laboratory': 0,
    'Pharmacy': 0
  };

  const byPriority: Record<Priority, number> = {
    'Low': 0,
    'Medium': 0,
    'High': 0,
    'Emergency': 0
  };

  patients.forEach(p => {
    if (p.status === 'Waiting' || p.status === 'Called' || p.status === 'Serving') {
      if (byDepartment[p.recommendedDepartment] !== undefined) {
        byDepartment[p.recommendedDepartment]++;
      }
      if (byPriority[p.triagePriority] !== undefined) {
        byPriority[p.triagePriority]++;
      }
    }
  });

  return NextResponse.json({
    totalWaiting: waiting.length + called.length,
    totalServedToday: completed.length,
    averageWaitTimeMinutes: avgWait,
    byDepartment,
    byPriority,
    activeDoctorsCount: 6
  });
}
