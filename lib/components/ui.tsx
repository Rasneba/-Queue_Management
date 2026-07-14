'use client';

import { cn } from "@/lib/utils/cn";

export function BrandMark({ className }: { className?: string }) {
  return (
    <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 via-emerald-500 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-emerald-200/50", className)}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    </div>
  );
}

export function Logo({ variant = "light", size = "md" }: { variant?: "light" | "dark"; size?: "sm" | "md" }) {
  return (
    <div className="flex items-center gap-2.5">
      <BrandMark className={size === "sm" ? "w-8 h-8" : "w-10 h-10"} />
      <span className={cn("font-extrabold tracking-tight", size === "sm" ? "text-lg" : "text-xl", variant === "light" ? "text-slate-800" : "text-white")}>
        Lancet <span className="font-bold">General Hospital</span>
      </span>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const meta: Record<string, { bg: string; text: string; dot: string; ring: string }> = {
    Waiting: { bg: "bg-slate-50", text: "text-slate-700", dot: "bg-slate-400", ring: "ring-slate-200" },
    Called: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500", ring: "ring-amber-200" },
    Serving: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500", ring: "ring-blue-200" },
    Completed: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", ring: "ring-emerald-200" },
    NoShow: { bg: "bg-rose-50", text: "text-rose-700", dot: "bg-rose-500", ring: "ring-rose-200" },
  };
  const m = meta[status] || meta.Waiting;
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ring-1 ring-inset", m.bg, m.text, m.ring)}>
      <span className={cn("w-1.5 h-1.5 rounded-full", m.dot)} />
      {status}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  const isUrgent = priority === "Emergency" || priority === "High";
  return (
    <span className={cn(
      "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider",
      isUrgent ? "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200" : "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200"
    )}>
      {priority}
    </span>
  );
}

export function LiveDot({ className }: { className?: string }) {
  return (
    <span className={cn("relative flex h-2.5 w-2.5", className)}>
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
    </span>
  );
}

export function Avatar({ name, className }: { name: string; className?: string }) {
  const initials = name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div className={cn("w-9 h-9 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 ring-1 ring-inset ring-slate-200", className)}>
      {initials}
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <svg className={cn("animate-spin h-5 w-5 text-slate-400", className)} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export function KPICard({ icon, value, label, sub, gradient }: {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  sub?: string;
  gradient?: string;
}) {
  return (
    <div className="relative overflow-hidden bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:-translate-y-0.5 transition-all duration-200">
      {gradient && <div className={cn("absolute inset-0 opacity-[0.03] bg-gradient-to-br", gradient)} />}
      <div className="relative flex items-center gap-4">
        <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-lg", gradient ? `bg-gradient-to-br ${gradient}` : "bg-slate-900")}>
          {icon}
        </div>
        <div>
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{label}</div>
          <div className="text-2xl font-extrabold text-slate-800 mt-0.5 tabular-nums">{value}</div>
          {sub && <div className="text-[10px] text-slate-400 font-medium mt-0.5">{sub}</div>}
        </div>
      </div>
    </div>
  );
}

export function Card({ children, className, hover }: { children: React.ReactNode; className?: string; hover?: boolean }) {
  return (
    <div className={cn("bg-white rounded-2xl border border-slate-100 shadow-sm", hover && "hover:-translate-y-0.5 hover:shadow-md transition-all duration-200", className)}>
      {children}
    </div>
  );
}
