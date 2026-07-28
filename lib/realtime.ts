import { EventEmitter } from "events";

const globalRef = globalThis as typeof globalThis & {
  __patientEmitter?: EventEmitter;
};

const emitter =
  globalRef.__patientEmitter ||
  (globalRef.__patientEmitter = new EventEmitter());

emitter.setMaxListeners(50);

export type PatientEventType = "patients" | "doctors" | "staff" | "stats";

export type PatientEvent = { type: PatientEventType };

const activeListeners = new Set<symbol>();

export function onPatientChange(listener: (e: PatientEvent) => void): () => void {
  const id = Symbol();
  activeListeners.add(id);

  const handler = (e: PatientEvent) => listener(e);
  emitter.on("change", handler);

  return () => {
    activeListeners.delete(id);
    emitter.off("change", handler);
  };
}

export function getListenerCount(): number {
  return activeListeners.size;
}

export function notifyPatientsChanged(type: PatientEventType = "patients"): void {
  emitter.emit("change", { type });
}
