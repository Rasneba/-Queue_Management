'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import {
  UserCheck, Tv, Stethoscope, BarChart2, BarChart3,
  CheckCircle2, Ticket, ArrowRight, Globe, Moon, Sun,
  Activity, Users, Clock, Shield
} from 'lucide-react';
import { Language, t } from '@/lib/utils/translations';
import { preloadVoices } from '@/lib/utils/tts';
import usePatients from '@/lib/hooks/usePatients';
import LiveClock from '@/lib/components/Clock';

const PatientStatusModal = dynamic(() => import('@/lib/components/PatientStatusModal'), { ssr: false });

const MODULES = [
  {
    href: '/checkin',
    titleKey: 'tabSelfCheckIn',
    desc: 'Patient self-service check-in kiosk',
    icon: UserCheck,
    gradient: 'from-emerald-500 to-teal-600',
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    border: 'border-emerald-200 dark:border-emerald-800',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    href: '/triage',
    titleKey: 'tabTriageKiosk',
    desc: 'Clinical triage and priority assignment',
    icon: CheckCircle2,
    gradient: 'from-blue-500 to-indigo-600',
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    border: 'border-blue-200 dark:border-blue-800',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  {
    href: '/board',
    titleKey: 'tabWaitingBoard',
    desc: 'Live waiting room display board',
    icon: Tv,
    gradient: 'from-violet-500 to-purple-600',
    bg: 'bg-violet-50 dark:bg-violet-950/30',
    border: 'border-violet-200 dark:border-violet-800',
    iconColor: 'text-violet-600 dark:text-violet-400',
  },
  {
    href: '/doctor',
    titleKey: 'tabStaffConsole',
    desc: 'Doctor and staff consultation console',
    icon: Stethoscope,
    gradient: 'from-rose-500 to-pink-600',
    bg: 'bg-rose-50 dark:bg-rose-950/30',
    border: 'border-rose-200 dark:border-rose-800',
    iconColor: 'text-rose-600 dark:text-rose-400',
  },
  {
    href: '/reception',
    titleKey: 'tabReceptionDesk',
    desc: 'Front desk patient management',
    icon: Ticket,
    gradient: 'from-amber-500 to-orange-600',
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    border: 'border-amber-200 dark:border-amber-800',
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
  {
    href: '/analytics',
    titleKey: 'tabAnalytics',
    desc: 'Queue analytics and performance metrics',
    icon: BarChart2,
    gradient: 'from-cyan-500 to-sky-600',
    bg: 'bg-cyan-50 dark:bg-cyan-950/30',
    border: 'border-cyan-200 dark:border-cyan-800',
    iconColor: 'text-cyan-600 dark:text-cyan-400',
  },
  {
    href: '/reports',
    title: 'Reports',
    desc: 'Detailed reports and data export',
    icon: BarChart3,
    gradient: 'from-slate-500 to-gray-600',
    bg: 'bg-slate-100 dark:bg-slate-800/50',
    border: 'border-slate-200 dark:border-slate-700',
    iconColor: 'text-slate-600 dark:text-slate-400',
  },
];

export default function HomeClient() {
  const [language, setLanguage] = useState<Language>('en');
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('app_dark_mode') === 'true';
    return false;
  });
  const [queriedPatientId, setQueriedPatientId] = useState<string | null>(null);
  const { patients } = usePatients();

  const patientStats = useMemo(() => ({
    total: patients.length,
    inQueue: patients.filter(p => p.status === 'Waiting' || p.status === 'Called' || p.status === 'Serving').length,
    completed: patients.filter(p => p.status === 'Completed').length,
  }), [patients]);

  useEffect(() => {
    preloadVoices();
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('app_dark_mode', String(darkMode));
  }, [darkMode]);

  useEffect(() => {
    const saved = localStorage.getItem('app_language');
    if (saved === 'am' || saved === 'om') setLanguage(saved);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pId = params.get('patientId');
    if (pId) setQueriedPatientId(pId);
  }, []);

  const handleCloseStatusTracker = () => {
    setQueriedPatientId(null);
    const url = new URL(window.location.href);
    url.searchParams.delete('patientId');
    window.history.replaceState({}, '', url.pathname + url.search);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-900 text-slate-900 dark:text-slate-100 antialiased flex flex-col font-sans">
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 transition-all shadow-[0_2px_15px_rgba(0,0,0,0.015)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Image src="/lancetlogo.png" alt="Lancet General Hospital" width={48} height={48} className="h-12 w-auto object-contain" priority />
            <div className="h-12 w-[1px] bg-slate-200 dark:bg-slate-700"></div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100 font-sans">
                {t('hospitalName', language)}
              </h1>
              <p className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-[0.15em]">
                {t('aiTriageHub', language)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200/40 dark:border-slate-700/40">
              <Globe className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <select
                value={language}
                onChange={(e) => {
                  const newLang = e.target.value as Language;
                  setLanguage(newLang);
                  localStorage.setItem('app_language', newLang);
                }}
                className="bg-transparent border-none text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer pr-2 outline-none"
              >
                <option value="en">English</option>
                <option value="am">Amharic</option>
                <option value="om">Afaan Oromoo</option>
              </select>
            </div>
            <button
              type="button"
              onClick={() => setDarkMode(!darkMode)}
              className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl border border-slate-200/40 dark:border-slate-700/40 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all text-xs font-bold text-slate-600 dark:text-slate-400 cursor-pointer"
              title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {darkMode ? <Sun className="w-3.5 h-3.5 text-amber-500" /> : <Moon className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{darkMode ? 'Light' : 'Dark'}</span>
            </button>
              <div className="hidden md:flex items-center gap-5 text-right">
                <div className="h-10 w-[1px] bg-slate-200 dark:bg-slate-700"></div>
                <LiveClock
                  timeClassName="text-2xl font-black tabular-nums text-slate-800 dark:text-slate-100 leading-none"
                  dateClassName="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mt-1"
                />
              </div>
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight mb-2">
            {language === 'am' ? 'የሥራ ቦታ ምርጫ' : language === 'om' ? 'Filannoo Hojii' : 'Select Your Workspace'}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
            {language === 'am' ? 'ግዚያዊ መስሪያ ቦትዎን ይምረጡ ወይም በቃ ላይ በመግባት ይပြင်ဆငါ' : language === 'om' ? 'Buufata hojii keessan filadhaa' : 'Choose a module to open in fullscreen, or access the back office for administration.'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {MODULES.map((mod) => {
            const Icon = mod.icon;
            const title = 'title' in mod ? mod.title : t(mod.titleKey, language);
            return (
              <Link
                key={mod.href}
                href={mod.href}
                className={`group relative ${mod.bg} ${mod.border} border rounded-2xl p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex flex-col gap-4`}
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${mod.gradient} flex items-center justify-center shadow-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-1">{title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{mod.desc}</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">
                  Open fullscreen
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}

          <Link
            href="/backoffice"
            className="group relative bg-slate-900 dark:bg-slate-800 border border-slate-700 dark:border-slate-600 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex flex-col gap-4"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center shadow-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-white mb-1">Back Office</h3>
              <p className="text-xs text-slate-400 leading-relaxed">Administration, staff management, and system settings</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 group-hover:text-slate-300 transition-colors">
              Open back office
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>

        <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 text-center">
            <Users className="w-5 h-5 text-blue-500 mx-auto mb-2" />
            <div className="text-2xl font-black text-slate-800 dark:text-slate-100">{patientStats.total}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Patients</div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 text-center">
            <Activity className="w-5 h-5 text-emerald-500 mx-auto mb-2" />
            <div className="text-2xl font-black text-slate-800 dark:text-slate-100">
              {patientStats.inQueue}
            </div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">In Queue</div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 text-center">
            <CheckCircle2 className="w-5 h-5 text-green-500 mx-auto mb-2" />
            <div className="text-2xl font-black text-slate-800 dark:text-slate-100">
              {patientStats.completed}
            </div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Completed</div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 text-center">
            <Clock className="w-5 h-5 text-amber-500 mx-auto mb-2" />
            <LiveClock timeClassName="text-2xl font-black text-slate-800 dark:text-slate-100" />
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Current Time</div>
          </div>
        </div>
      </main>

      <footer className="bg-slate-900 border-t border-slate-800 py-5 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px]">
          <div className="flex items-center gap-3">
            <Image src="/lancetlogo.png" alt="Lancet" width={32} height={32} className="h-8 w-auto object-contain brightness-0 invert opacity-60" />
            <div className="text-slate-400">
              <span className="font-bold text-slate-300">Lancet General Hospital</span>
              <span className="mx-2">|</span>
              Megenagna, Afarensis Bldg, Addis Ababa
              <span className="mx-2">|</span>
              +251 977 171 71
            </div>
          </div>
          <div className="flex gap-4 text-slate-500">
            <span className="flex items-center gap-1.5 uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Triage Active
            </span>
            <span className="flex items-center gap-1.5 uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span> Next.js
            </span>
          </div>
        </div>
      </footer>

      {queriedPatientId && (
        <PatientStatusModal
          patientId={queriedPatientId}
          patients={patients}
          onClose={handleCloseStatusTracker}
          onRefresh={async () => {}}
        />
      )}
    </div>
  );
}
