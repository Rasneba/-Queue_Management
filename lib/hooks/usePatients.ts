'use client';
import { usePatientStore, ALL_PATIENTS } from './patientStore';

export default function usePatients() {
  return usePatientStore(ALL_PATIENTS);
}
