'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { Logo, LiveDot, BrandMark } from "./ui";
import { Stethoscope, ClipboardList, BarChart2, LayoutGrid, Users, ExternalLink } from "lucide-react";

const NAV_ITEMS = [
  { href: "/doctor", label: "Doctor", icon: Stethoscope },
  { href: "/reception", label: "Reception", icon: ClipboardList },
  { href: "/admin", label: "Admin", icon: LayoutGrid },
  { href: "/analytics", label: "Analytics", icon: BarChart2 },
];

export function StaffNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5">
              <BrandMark className="w-9 h-9" />
              <div className="hidden sm:block">
                <div className="text-sm font-extrabold text-slate-800 tracking-tight leading-none">Lancet General Hospital</div>
                <div className="text-[9px] font-bold text-emerald-600 uppercase tracking-[0.15em]">Triage Queue System</div>
              </div>
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                    isActive
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                  )}
                >
                  <item.icon className="w-3.5 h-3.5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200">
              <LiveDot />
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Live</span>
            </div>
            <Link
              href="/track"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
            >
              <Users className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Patient View</span>
              <ExternalLink className="w-3 h-3 opacity-50" />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

export function PageHeader({ eyebrow, title, subtitle, children }: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
      <div>
        {eyebrow && <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-[0.15em] mb-1">{eyebrow}</div>}
        <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">{title}</h2>
        {subtitle && <p className="text-xs text-slate-400 font-medium mt-1">{subtitle}</p>}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <StaffNav />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
