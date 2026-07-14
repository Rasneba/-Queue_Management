'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Stethoscope, ClipboardList, Activity, ArrowRight } from 'lucide-react';

interface Stats {
  totalPatients: number;
  waiting: number;
  serving: number;
  completed: number;
  activeDoctors: number;
  totalStaff: number;
}

export default function BackOfficeDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [patientsRes, doctorsRes, staffRes] = await Promise.all([
          fetch('/api/stats'),
          fetch('/api/doctors/active'),
          fetch('/api/staff'),
        ]);
        const patients = await patientsRes.json();
        const doctors = await doctorsRes.json();
        const staff = await staffRes.json();
        setStats({
          totalPatients: (patients.waiting || 0) + (patients.called || 0) + (patients.serving || 0) + (patients.completed || 0),
          waiting: patients.waiting || 0,
          serving: patients.serving || 0,
          completed: patients.completed || 0,
          activeDoctors: doctors.length,
          totalStaff: staff.length,
        });
      } catch { /* silent */ }
    };
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const cards = stats ? [
    { label: 'Total Patients', value: stats.totalPatients, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
    { label: 'Waiting', value: stats.waiting, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
    { label: 'Serving', value: stats.serving, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
    { label: 'Completed', value: stats.completed, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
    { label: 'Active Doctors', value: stats.activeDoctors, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100' },
    { label: 'Registered Staff', value: stats.totalStaff, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' },
  ] : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black text-slate-800 tracking-tight">Dashboard</h1>
        <p className="text-xs text-slate-400 font-medium mt-0.5">System overview and quick stats</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {cards.map(card => (
          <div key={card.label} className={`p-5 rounded-2xl border ${card.bg} ${card.border}`}>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{card.label}</span>
            <div className={`text-3xl font-black mt-1 ${card.color}`}>{card.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => router.push('/backoffice/staff')}
          className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all text-left group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-800">Staff Management</div>
                <div className="text-[10px] text-slate-400 font-medium">Register reception, triage & doctors</div>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 transition-colors" />
          </div>
        </button>

        <button
          onClick={() => router.push('/backoffice/reports')}
          className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all text-left group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                <Activity className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-800">Reports & Analytics</div>
                <div className="text-[10px] text-slate-400 font-medium">Triage, reception, doctor performance</div>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 transition-colors" />
          </div>
        </button>

        <a
          href="/"
          target="_blank"
          className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all text-left group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center">
                <ClipboardList className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-800">Open Queue App</div>
                <div className="text-[10px] text-slate-400 font-medium">Launch the main hospital queue</div>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-amber-600 transition-colors" />
          </div>
        </a>
      </div>
    </div>
  );
}
