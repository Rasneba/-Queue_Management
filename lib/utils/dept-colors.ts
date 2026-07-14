export type DeptColor = "teal" | "indigo" | "rose" | "amber" | "violet" | "cyan";

export const DEPT_COLORS: Record<string, DeptColor> = {
  "Cardiology": "rose",
  "Pediatrics": "amber",
  "Orthopedics": "indigo",
  "General Medicine": "teal",
  "Emergency": "rose",
  "Neurology": "violet",
  "Oncology": "indigo",
  "Gynecology": "cyan",
  "ENT": "amber",
  "Dermatology": "teal",
  "Ophthalmology": "cyan",
  "Radiology": "violet",
  "Laboratory": "indigo",
  "Pharmacy": "teal",
};

export const DEPT_GRADIENTS: Record<DeptColor, string> = {
  teal: "from-teal-500 to-emerald-500",
  indigo: "from-indigo-500 to-blue-500",
  rose: "from-rose-500 to-pink-500",
  amber: "from-amber-500 to-orange-500",
  violet: "from-violet-500 to-purple-500",
  cyan: "from-cyan-500 to-sky-500",
};

export const DEPT_SOFT_BG: Record<DeptColor, string> = {
  teal: "bg-teal-50",
  indigo: "bg-indigo-50",
  rose: "bg-rose-50",
  amber: "bg-amber-50",
  violet: "bg-violet-50",
  cyan: "bg-cyan-50",
};

export const DEPT_TEXT: Record<DeptColor, string> = {
  teal: "text-teal-600",
  indigo: "text-indigo-600",
  rose: "text-rose-600",
  amber: "text-amber-600",
  violet: "text-violet-600",
  cyan: "text-cyan-600",
};

export const DEPT_RING: Record<DeptColor, string> = {
  teal: "ring-teal-200",
  indigo: "ring-indigo-200",
  rose: "ring-rose-200",
  amber: "ring-amber-200",
  violet: "ring-violet-200",
  cyan: "ring-cyan-200",
};

export const DEPT_BAR: Record<DeptColor, string> = {
  teal: "bg-teal-500",
  indigo: "bg-indigo-500",
  rose: "bg-rose-500",
  amber: "bg-amber-500",
  violet: "bg-violet-500",
  cyan: "bg-cyan-500",
};

export function deptColor(dept: string): DeptColor {
  return DEPT_COLORS[dept] || "teal";
}
