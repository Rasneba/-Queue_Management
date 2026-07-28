'use client';
import { usePatientStore, ACTIVE_PATIENTS } from './patientStore';

export default function useActivePatients() {
  return usePatientStore(ACTIVE_PATIENTS);
}
