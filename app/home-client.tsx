'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import dynamic from 'next/dynamic';
import {
  Heart, Tv, Stethoscope, BarChart2, CheckCircle2,
  AlertCircle, RefreshCw, PlusCircle, UserCheck, Ticket, Globe
} from 'lucide-react';
import { Patient } from '@/lib/types';
import SelfCheckInView from '@/lib/components/SelfCheckInView';
import PatientStatusModal from '@/lib/components/PatientStatusModal';
import { Language, t } from '@/lib/utils/translations';
import { preloadVoices } from '@/lib/utils/tts';

const KioskView = dynamic(() => import('@/lib/components/KioskView'), { ssr: false });
const WaitingBoard = dynamic(() => import('@/lib/components/WaitingBoard'), { ssr: false });
const DoctorDashboard = dynamic(() => import('@/lib/components/DoctorDashboard'), { ssr: false });
const AnalyticsView = dynamic(() => import('@/lib/components/AnalyticsView'), { ssr: false });
const ReceptionConsole = dynamic(() => import('@/lib/components/ReceptionConsole'), { ssr: false });

export default function HomeClient() {
  const [activeView, setActiveView] = useState<'checkin' | 'triage' | 'board' | 'doctor' | 'analytics' | 'reception'>('checkin');
  const [language, setLanguage] = useState<Language>('en');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [queriedPatientId, setQueriedPatientId] = useState<string | null>(null);

  const [timeStr, setTimeStr] = useState('00:00');
  const [dateStr, setDateStr] = useState('Monday, Oct 24');

  useEffect(() => {
    preloadVoices();
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('app_language');
    if (saved === 'am' || saved === 'om') setLanguage(saved);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pId = params.get('patientId');
    if (pId) {
      setQueriedPatientId(pId);
    }
  }, []);

  const handleCloseStatusTracker = () => {
    setQueriedPatientId(null);
    const url = new URL(window.location.href);
    url.searchParams.delete('patientId');
    window.history.replaceState({}, '', url.pathname + url.search);
  };

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
      setDateStr(now.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' }));
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchPatients = useCallback(async () => {
    try {
      const res = await fetch('/api/patients');
      if (!res.ok) throw new Error('Failed to retrieve queue information');
      const data = await res.json();
      setPatients(data);
      setError(null);
    } catch {
      setError('Connection lost. Re-establishing server sync...');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPatients();
    const interval = setInterval(fetchPatients, 6000);
    return () => clearInterval(interval);
  }, [fetchPatients]);

  const handleResetDatabase = useCallback(async () => {
    if (!window.confirm("Are you sure you want to reset the queue database to default values?")) return;
    try {
      setLoading(true);
      const res = await fetch('/api/reset', { method: 'POST' });
      if (!res.ok) throw new Error('Reset request failed');
      const data = await res.json();
      setPatients(data.patients);
      showNotification("Queue database has been reset successfully.");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to reset";
      alert(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleNewCheckIn = useCallback((newPatient: Patient) => {
    setPatients(prev => [...prev, newPatient]);
    showNotification(`Ticket ${newPatient.id} generated for ${newPatient.name}!`);
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 antialiased flex flex-col font-sans">
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 border border-slate-800 text-blue-300 py-3 px-6 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-semibold"
          >
            <CheckCircle2 className="w-4 h-4 text-blue-400" />
            <span>{notification}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 transition-all shadow-[0_2px_15px_rgba(0,0,0,0.015)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img src="/lancetlogo.png" alt="Lancet General Hospital" className="h-12 w-auto object-contain" />
            <div className="h-12 w-[1px] bg-slate-200"></div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-slate-800 font-sans">
                {t('hospitalName', language)}
              </h1>
              <p className="text-[10px] text-blue-600 font-bold uppercase tracking-[0.15em]">
                {t('aiTriageHub', language)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <nav className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/50">
              <button
                onClick={() => setActiveView('checkin')}
                className={`flex items-center gap-1.5 py-1.5 px-3.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                  activeView === 'checkin'
                    ? 'bg-white text-emerald-700 shadow-sm font-bold border border-emerald-100'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                {t('tabSelfCheckIn', language)}
              </button>
              <button
                onClick={() => setActiveView('triage')}
                className={`flex items-center gap-1.5 py-1.5 px-3.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                  activeView === 'triage'
                    ? 'bg-white text-blue-700 shadow-sm font-bold border border-blue-100'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <PlusCircle className="w-3.5 h-3.5 text-blue-600" />
                {t('tabTriageKiosk', language)}
              </button>
              <button
                onClick={() => setActiveView('board')}
                className={`flex items-center gap-1.5 py-1.5 px-3.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                  activeView === 'board'
                    ? 'bg-white text-blue-600 shadow-sm font-bold'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Tv className="w-3.5 h-3.5" />
                {t('tabWaitingBoard', language)}
              </button>
              <button
                onClick={() => setActiveView('doctor')}
                className={`flex items-center gap-1.5 py-1.5 px-3.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                  activeView === 'doctor'
                    ? 'bg-white text-blue-600 shadow-sm font-bold'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Stethoscope className="w-3.5 h-3.5" />
                {t('tabStaffConsole', language)}
              </button>
              <button
                onClick={() => setActiveView('reception')}
                className={`flex items-center gap-1.5 py-1.5 px-3.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                  activeView === 'reception'
                    ? 'bg-white text-blue-600 shadow-sm font-bold border border-blue-100'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Ticket className="w-3.5 h-3.5 text-blue-600" />
                {t('tabReceptionDesk', language)}
              </button>
              <button
                onClick={() => setActiveView('analytics')}
                className={`flex items-center gap-1.5 py-1.5 px-3.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                  activeView === 'analytics'
                    ? 'bg-white text-blue-600 shadow-sm font-bold'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <BarChart2 className="w-3.5 h-3.5" />
                {t('tabAnalytics', language)}
              </button>
            </nav>

            <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200/40">
              <span className="text-slate-500 pl-1">
                <Globe className="w-3.5 h-3.5 animate-spin-slow" />
              </span>
              <select
                value={language}
                onChange={(e) => {
                  const newLang = e.target.value as Language;
                  setLanguage(newLang);
                  localStorage.setItem('app_language', newLang);
                }}
                className="bg-transparent border-none text-xs font-bold text-slate-700 focus:outline-none cursor-pointer pr-2 outline-none"
              >
                <option value="en">English</option>
                <option value="am">Amharic</option>
                <option value="om">Afaan Oromoo</option>
              </select>
            </div>

            <div className="hidden md:flex items-center gap-5 text-right">
              <div className="h-10 w-[1px] bg-slate-200"></div>
              <div>
                <div className="text-2xl font-black tabular-nums text-slate-800 leading-none">{timeStr}</div>
                <div className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-1">{dateStr}</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {error && (
        <div className="bg-rose-50 border-b border-rose-100 text-rose-800 text-xs py-2 px-4 text-center font-medium flex items-center justify-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 animate-pulse" />
          <span>{error}</span>
          <button
            type="button"
            onClick={fetchPatients}
            className="underline font-bold text-rose-900 hover:text-rose-950 flex items-center gap-0.5 ml-2"
          >
            <RefreshCw className="w-3 h-3 animate-spin" /> Force Reconnect
          </button>
        </div>
      )}

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeView}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
          >
            {activeView === 'checkin' && (
              <SelfCheckInView onCheckInSuccess={handleNewCheckIn} patients={patients} language={language} />
            )}
            {activeView === 'triage' && (
              <KioskView onCheckInSuccess={handleNewCheckIn} patients={patients} language={language} />
            )}
            {activeView === 'board' && (
              <WaitingBoard patients={patients} language={language} isOffline={!!error} />
            )}
            {activeView === 'doctor' && (
              <DoctorDashboard
                patients={patients}
                onUpdatePatients={fetchPatients}
                onResetDatabase={handleResetDatabase}
              />
            )}
            {activeView === 'reception' && (
              <ReceptionConsole
                patients={patients}
                onUpdatePatients={fetchPatients}
                language={language}
                isOffline={!!error}
              />
            )}
            {activeView === 'analytics' && (
              <AnalyticsView patients={patients} />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="bg-slate-900 border-t border-slate-800 py-5 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px]">
          <div className="flex items-center gap-3">
            <img src="/lancetlogo.png" alt="Lancet" className="h-8 w-auto object-contain brightness-0 invert opacity-60" />
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

      <AnimatePresence>
        {queriedPatientId && (
          <PatientStatusModal
            patientId={queriedPatientId}
            patients={patients}
            onClose={handleCloseStatusTracker}
            onRefresh={fetchPatients}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
