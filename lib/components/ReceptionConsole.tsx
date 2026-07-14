'use client';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users, UserCheck, Clock, ShieldAlert, Play, CheckCircle,
  RefreshCw, LogOut, Ticket, PauseCircle, Send, ArrowRight,
  ChevronRight, Volume2, VolumeX, Search, Info, HelpCircle, Lock, Eye, EyeOff,
  AlertCircle, Stethoscope, FileText, SkipForward, ClipboardList
} from 'lucide-react';
import { Patient, Priority, Department } from '@/lib/types';
import { playPleasantChime } from '@/lib/utils/audio';
import { speakTicket, stopSpeech, isSpeaking, preloadVoices } from '@/lib/utils/tts';
import { Language, t } from '@/lib/utils/translations';

interface ReceptionConsoleProps {
  patients: Patient[];
  onUpdatePatients: () => void;
  language?: Language;
  isOffline?: boolean;
}

interface ActiveDoctor {
  id: string;
  doctorName: string;
  room: string;
  department: string;
}

const DEPARTMENTS: Department[] = [
  'General Medicine', 'Pediatrics', 'Cardiology', 'Orthopedics', 'Emergency',
  'Neurology', 'Oncology', 'Gynecology', 'Ophthalmology', 'ENT',
  'Dermatology', 'Radiology', 'Laboratory', 'Pharmacy'
];

const PRESET_COUNTERS = ["Reception 1", "Reception 2", "Reception 3", "Reception 4"];

export default function ReceptionConsole({ patients, onUpdatePatients, language = 'en', isOffline = false }: ReceptionConsoleProps) {
  const [counterName, setCounterName] = useState<string>(() => localStorage.getItem('reception_counter_name') || "");
  const [selectedPreset, setSelectedPreset] = useState<string>("Reception 1");
  const [customCounter, setCustomCounter] = useState<string>("");
  const [loadingAction, setLoadingAction] = useState(false);
  const [password, setPassword] = useState<string>("");
  const [passwordError, setPasswordError] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const [audioEnabled, setAudioEnabled] = useState(() => {
    const saved = localStorage.getItem('reception_tts_enabled');
    return saved !== null ? saved === 'true' : true;
  });

  useEffect(() => { preloadVoices(); }, []);
  useEffect(() => { localStorage.setItem('reception_tts_enabled', String(audioEnabled)); }, [audioEnabled]);

  const priorityLevelOrder = { 'VIP': 3, 'Urgent': 2, 'Standard': 1 };
  const priorityOrder: Record<Priority, number> = { 'Emergency': 4, 'High': 3, 'Medium': 2, 'Low': 1 };

  const waitingPatients = useMemo(() => {
    return patients
      .filter(p => p.status === 'Waiting')
      .sort((a, b) => {
        const aNum = parseInt(a.id.replace('P-', ''), 10) || 0;
        const bNum = parseInt(b.id.replace('P-', ''), 10) || 0;
        return aNum - bNum;
      });
  }, [patients]);

  const currentPatient = useMemo(() => patients.find(p =>
    p.assignedRoom === counterName &&
    (p.status === 'Called' || p.status === 'Serving')
  ), [patients, counterName]);

  const [activeDoctors, setActiveDoctors] = useState<ActiveDoctor[]>([]);
  const [showTriageForm, setShowTriageForm] = useState(false);
  const [triageSymptoms, setTriageSymptoms] = useState("");
  const [showDoctorAssign, setShowDoctorAssign] = useState(false);
  const lastAutoCalledRef = useRef<string | null>(null);

  const handleCallPatient = useCallback(async (patientId: string) => {
    setLoadingAction(true);
    try {
      const res = await fetch('/api/patients/call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: patientId, room: counterName })
      });
      if (res.ok) {
        playPleasantChime();
        if (audioEnabled) {
          setTimeout(() => speakTicket(patientId, counterName), 1200);
        }
        onUpdatePatients();
      }
    } catch (err) {
      console.error("Error calling patient:", err);
    } finally {
      setLoadingAction(false);
    }
  }, [counterName, audioEnabled, onUpdatePatients]);

  const fetchActiveDoctors = useCallback(async () => {
    try {
      const res = await fetch('/api/doctors/active');
      if (res.ok) setActiveDoctors(await res.json());
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    if (!counterName) return;
    fetchActiveDoctors();
    const interval = setInterval(fetchActiveDoctors, 15000);
    return () => clearInterval(interval);
  }, [fetchActiveDoctors, counterName]);

  useEffect(() => {
    if (!counterName || currentPatient) return;
    if (waitingPatients.length === 0) return;

    const nextId = waitingPatients[0].id;
    if (lastAutoCalledRef.current === nextId) return;
    lastAutoCalledRef.current = nextId;

    const timer = setTimeout(() => {
      handleCallPatient(nextId);
    }, 1500);
    return () => clearTimeout(timer);
  }, [patients, counterName, currentPatient, waitingPatients, handleCallPatient]);

  const handleLogin = (name: string) => {
    const finalName = name.trim();
    if (!finalName) {
      setPasswordError(language === 'am' ? "እባክዎ የመቀበያ ክፍል ይምረጡ።" : "Please select a counter.");
      return;
    }
    if (!password) {
      setPasswordError(language === 'am' ? "የይለፍ ቃል ያስፈልጋል।" : "Password is required.");
      return;
    }
    if (password !== 'reception123' && password !== 'admin') {
      setPasswordError(language === 'am' ? "የይለፍ ቃል የተሳሳተ ነው። ፍንጭ፦ 'reception123' ወይም 'admin'" : "Incorrect password. Hint: 'reception123' or 'admin'");
      return;
    }
    setPasswordError("");
    setCounterName(finalName);
    localStorage.setItem('reception_counter_name', finalName);
    setPassword("");
  };

  const handleLogout = () => {
    setCounterName("");
    localStorage.removeItem('reception_counter_name');
    setPassword("");
    setPasswordError("");
  };

  const handleCompletePatient = async (patientId: string) => {
    setLoadingAction(true);
    try {
      const res = await fetch('/api/patients/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: patientId })
      });
      if (res.ok) {
        onUpdatePatients();
      }
    } catch (err) {
      console.error("Error completing patient:", err);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleServePatient = async (patientId: string) => {
    setLoadingAction(true);
    try {
      const res = await fetch('/api/patients/serve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: patientId })
      });
      if (res.ok) onUpdatePatients();
    } catch (err) {
      console.error("Error serving patient:", err);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleHoldPatient = async () => {
    if (!currentPatient) return;
    setLoadingAction(true);
    try {
      const res = await fetch('/api/patients/hold', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: currentPatient.id })
      });
      if (res.ok) onUpdatePatients();
    } catch (err) {
      console.error("Error holding patient:", err);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleSkipTriage = async () => {
    if (!currentPatient) return;
    setLoadingAction(true);
    try {
      const res = await fetch('/api/patients/triage-existing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: currentPatient.id, symptoms: currentPatient.symptoms })
      });
      if (res.ok) {
        setShowTriageForm(false);
        setShowDoctorAssign(true);
        onUpdatePatients();
      }
    } catch (err) {
      console.error("Skip triage error:", err);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleFullTriage = async () => {
    if (!currentPatient || !triageSymptoms.trim()) return;
    setLoadingAction(true);
    try {
      const res = await fetch('/api/patients/triage-existing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: currentPatient.id, symptoms: triageSymptoms.trim() })
      });
      if (res.ok) {
        setShowTriageForm(false);
        setShowDoctorAssign(true);
        onUpdatePatients();
      }
    } catch (err) {
      console.error("Full triage error:", err);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleAssignDoctor = async (doctor: ActiveDoctor) => {
    if (!currentPatient) return;
    setLoadingAction(true);
    try {
      const res = await fetch('/api/patients/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: currentPatient.id,
          assignedRoom: doctor.room,
          recommendedDepartment: doctor.department,
          status: "Called"
        })
      });
      if (res.ok) {
        setShowDoctorAssign(false);
        onUpdatePatients();
      }
    } catch (err) {
      console.error("Assign doctor error:", err);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleRecallPatient = async () => {
    if (!currentPatient) return;
    setLoadingAction(true);
    try {
      const res = await fetch('/api/patients/call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: currentPatient.id, room: counterName })
      });
      if (res.ok) {
        playPleasantChime();
        if (audioEnabled) {
          setTimeout(() => speakTicket(currentPatient.id, counterName), 1200);
        }
        onUpdatePatients();
      }
    } catch (err) {
      console.error("Error recalling patient:", err);
    } finally {
      setLoadingAction(false);
    }
  };

  const getPriorityStyles = (p: Priority) => {
    switch (p) {
      case 'Emergency': return { bg: 'bg-rose-50 border-rose-100', text: 'text-rose-700', badge: 'bg-rose-600 text-white' };
      case 'High': return { bg: 'bg-orange-50 border-orange-100', text: 'text-orange-700', badge: 'bg-orange-500 text-white' };
      case 'Medium': return { bg: 'bg-amber-50 border-amber-100', text: 'text-amber-700', badge: 'bg-amber-500 text-white' };
      default: return { bg: 'bg-emerald-50 border-emerald-100', text: 'text-emerald-700', badge: 'bg-emerald-600 text-white' };
    }
  };

  const L = (am: string, om: string, en: string) => language === 'am' ? am : language === 'om' ? om : en;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {isOffline && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-rose-50 border border-rose-200/60 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-rose-800 text-xs font-semibold shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse flex-shrink-0" />
            <span><strong>{L('ከመስመር ውጭ፦', 'Offline:', 'Offline:')}</strong> {L('የአገልጋይ ግንኙነት ተቋርጧል።', 'Gergariin citeera.', 'Connection lost.')}</span>
          </div>
          <button type="button" onClick={onUpdatePatients} className="px-3.5 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-900 rounded-xl font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0">
            <RefreshCw className="w-3.5 h-3.5" /> {L('እንደገና ሞክር', 'Yaali', 'Retry')}
          </button>
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {!counterName ? (
          <motion.div key="login" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }}
            className="max-w-md mx-auto bg-white rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-slate-100 overflow-hidden mt-10">
            <div className="bg-gradient-to-r from-blue-700 to-blue-800 p-8 text-white text-center relative overflow-hidden">
              <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
              <div className="flex justify-center items-center gap-3 mb-2 relative z-10">
                <Ticket className="w-8 h-8 text-blue-100 animate-pulse" />
                <h2 className="text-2xl font-extrabold font-sans tracking-tight">{L('የመቀበያ ሰራተኛ መግቢያ', 'Seensa Simattuu', 'Receptionist Login')}</h2>
              </div>
              <p className="text-blue-100 text-xs font-semibold uppercase tracking-wider relative z-10">{L('ወደ ዴስክዎ ይግቡ', 'Gara deskii keessanii seenaa', 'Sign in to your counter desk')}</p>
            </div>
            <div className="p-8 space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2.5">{L('የመቀበያ ክፍል / ዴስክ ይምረጡ', 'Deskii Keessan Filadhaa', 'Select Counter / Desk')}</label>
                <div className="grid grid-cols-2 gap-3.5">
                  {PRESET_COUNTERS.map((preset) => (
                    <button key={preset} type="button" onClick={() => { setSelectedPreset(preset); setCustomCounter(""); }}
                      className={`py-3.5 px-4 rounded-2xl border text-center font-bold text-sm transition-all cursor-pointer ${
                        selectedPreset === preset && !customCounter ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200' : 'border-slate-100 text-slate-600 hover:border-blue-200 hover:bg-slate-50'
                      }`}>
                      {preset.replace("Reception", L("መቀበያ", "Deskii", "Reception"))}
                    </button>
                  ))}
                </div>
              </div>
              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-100"></div>
                <span className="flex-shrink mx-4 text-slate-400 text-[10px] font-bold uppercase tracking-wider">{L('ወይም ሌላ ክፍል', 'Yookaan biroo', 'Or custom')}</span>
                <div className="flex-grow border-t border-slate-100"></div>
              </div>
              <div>
                <input type="text" placeholder={L('ለምሳሌ፦ መቀበያ ክፍል 5', 'Fk. Deskii 5', 'e.g. Reception Desk 5')} value={customCounter}
                  onChange={(e) => { setCustomCounter(e.target.value); setSelectedPreset(""); }}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-sans" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">{L('የዴስክ ይለፍ ቃል', 'Fungurroo Deskii', 'Desk Password')}</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400"><Lock className="w-4 h-4" /></span>
                  <input type={showPassword ? "text" : "password"} placeholder={L('የይለፍ ቃል ያስገቡ', 'Fungurroo galchaa', 'Enter password')} value={password}
                    onChange={(e) => { setPassword(e.target.value); setPasswordError(""); }}
                    className="w-full pl-10 pr-10 py-3 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="mt-1.5 text-[10px] text-slate-400 font-medium">
                  {L('መደበኛ የይለፍ ቃል', 'Fungurroon idilee', 'Default:')} <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-blue-600 font-bold">reception123</code> {L('ወይም', 'yookaan', 'or')} <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-blue-600 font-bold">admin</code>
                </p>
              </div>
              {passwordError && (
                <div className="bg-rose-50 border border-rose-100 p-3.5 rounded-xl flex items-center gap-2.5 text-rose-700 text-xs font-semibold">
                  <ShieldAlert className="w-4 h-4 shrink-0" /> <span>{passwordError}</span>
                </div>
              )}
              <button type="button" onClick={() => handleLogin(customCounter || selectedPreset)}
                className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-3.5 rounded-2xl transition-colors flex items-center justify-center gap-2 shadow-md hover:shadow-lg hover:shadow-blue-200 cursor-pointer text-sm tracking-wide">
                {L('ወደ ዴስክ ግባ', 'Deskii Seenaa', 'Sign In')} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Header */}
              <div className="bg-white rounded-3xl border border-slate-100 p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                    <Ticket className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-800 tracking-tight font-sans">{counterName}</h3>
                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      {L('ዝግጁ ነው', 'Qophii', 'Ready')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={onUpdatePatients} className="p-2.5 rounded-xl border border-slate-100 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer" title="Refresh">
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-1 bg-slate-50 border border-slate-100 rounded-xl px-2 py-1">
                    <button type="button" onClick={() => { setAudioEnabled(!audioEnabled); if (!audioEnabled) { preloadVoices(); } else { stopSpeech(); } }}
                      className={`p-1.5 rounded-lg transition-all cursor-pointer ${audioEnabled ? 'bg-emerald-100 text-emerald-700' : 'text-slate-400 hover:text-slate-600'}`}>
                      {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                    </button>
                    <span className="text-[10px] font-bold text-slate-600 px-1">{audioEnabled ? 'AM+EN' : 'OFF'}</span>
                  </div>
                  <button type="button" onClick={handleLogout}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-transparent transition-all cursor-pointer uppercase tracking-wider">
                    <LogOut className="w-4 h-4" /> {L('ውጣ', 'Bahi', 'Sign Out')}
                  </button>
                </div>
              </div>

              {/* Current Patient Card */}
              <div className="bg-white rounded-[32px] border border-slate-100 shadow-[0_15px_40px_rgba(0,0,0,0.02)] overflow-hidden">
                <div className="border-b border-slate-100 p-6 flex items-center justify-between bg-slate-50/50">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-blue-600" />
                    <h4 className="font-bold text-slate-800">{L('የአሁኑ ትኬት', 'Tikkee Ammaa', 'Current Ticket')}</h4>
                  </div>
                  {currentPatient && (
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      currentPatient.status === 'Serving' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {currentPatient.status === 'Serving' ? L('ምርመራ ላይ', 'Madaallii', 'Serving') : L('ተጠርቷል', 'Waamamee', 'Called')}
                    </span>
                  )}
                </div>

                <div className="p-8">
                  {currentPatient ? (
                    <div className="space-y-6">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-dashed border-slate-100 pb-6">
                        <div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{L('ንቁ የተጠራ ትኬት', 'Tikkee Waamicha', 'Active Ticket')}</div>
                          <div className="text-4xl font-black text-blue-800 tracking-tight mt-1">{currentPatient.id}</div>
                          <div className="text-base font-extrabold text-slate-800 mt-1.5">{currentPatient.name}</div>
                          <div className="text-xs text-slate-400 font-medium mt-0.5">
                            {currentPatient.age}y • {currentPatient.gender === 'Male' ? L('ወንድ', 'Dhiira', 'M') : currentPatient.gender === 'Female' ? L('ሴት', 'Aleetti', 'F') : 'O'}
                          </div>
                        </div>
                        <div className="text-right flex flex-row sm:flex-col gap-2 sm:gap-1.5 items-center sm:items-end">
                          <span className={`px-3 py-1 rounded-lg text-xs font-bold ${getPriorityStyles(currentPatient.triagePriority).badge}`}>
                            {currentPatient.triagePriority === 'Emergency' ? L('አስቸኳይ', 'Tasaa', 'Emergency') :
                             currentPatient.triagePriority === 'High' ? L('ከፍተኛ', 'Guddaa', 'High') :
                             currentPatient.triagePriority === 'Medium' ? L('መካከለኛ', 'Giddu-galeessa', 'Medium') :
                             L('መደበኛ', 'Idilee', 'Standard')}
                          </span>
                          <span className="text-xs text-slate-500 font-bold uppercase tracking-wider bg-slate-100 px-2 py-1 rounded">{currentPatient.recommendedDepartment}</span>
                        </div>
                      </div>

                      <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-3">
                        <div className="flex items-start gap-2.5 text-xs text-slate-600 leading-relaxed">
                          <span className="font-bold text-slate-800 min-w-16">{L('የህመም ምልክቶች', 'Mallattoolee', 'Symptoms')}:</span>
                          <span className="italic">&quot;{currentPatient.symptoms}&quot;</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      {!showTriageForm && !showDoctorAssign && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 pt-2">
                          <button type="button" disabled={loadingAction} onClick={() => { setTriageSymptoms(currentPatient.symptoms); setShowTriageForm(true); }}
                            className="bg-amber-500 hover:bg-amber-600 text-white font-bold p-3 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all text-xs text-center cursor-pointer shadow-md shadow-amber-100">
                            <ClipboardList className="w-4 h-4" />
                            {L('ምርመራ', 'Madaalli', 'Full Triage')}
                          </button>

                          <button type="button" disabled={loadingAction} onClick={handleSkipTriage}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold p-3 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all text-xs text-center cursor-pointer shadow-md shadow-blue-100">
                            <SkipForward className="w-4 h-4" />
                            {L('ምርመራ ያልፈtsy', 'Madaalla Hin Qabne', 'Skip Triage')}
                          </button>

                          <button type="button" disabled={loadingAction} onClick={handleRecallPatient}
                            className="border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold p-3 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all text-xs text-center cursor-pointer">
                            <Volume2 className="w-4 h-4 text-blue-600" />
                            {L('ደግመህ ጥራ', 'Irra-deebi', 'Recall')}
                          </button>

                          <button type="button" disabled={loadingAction} onClick={handleHoldPatient}
                            className="border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold p-3 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all text-xs text-center cursor-pointer">
                            <PauseCircle className="w-4 h-4 text-amber-500" />
                            {L('አቆይ', 'Tursi', 'Hold')}
                          </button>
                        </div>
                      )}

                      {/* Full Triage Form */}
                      <AnimatePresence>
                        {showTriageForm && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden border-t border-slate-100 pt-5 mt-5">
                            <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-5 space-y-4">
                              <h5 className="text-xs font-bold text-amber-950 uppercase tracking-wider flex items-center gap-2">
                                <FileText className="w-4 h-4" /> {L('ሙሉ ቪስኑ ይሙሉ', 'Madaalli Guutuu', 'Complete Triage Form')}
                              </h5>
                              <textarea value={triageSymptoms} onChange={(e) => setTriageSymptoms(e.target.value)} rows={4}
                                placeholder={L('የታካሚውን ምልክቶች ያስገቡ...', 'Mallattoolee dhukkubsataa galchaa...', 'Enter patient symptoms...')}
                                className="w-full px-4 py-3 border border-amber-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm font-sans bg-white" />
                              <div className="flex gap-3">
                                <button type="button" disabled={loadingAction || !triageSymptoms.trim()} onClick={handleFullTriage}
                                  className="bg-amber-600 hover:bg-amber-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold py-2.5 px-5 rounded-xl transition-all text-xs cursor-pointer flex items-center gap-2">
                                  <CheckCircle className="w-4 h-4" /> {L('ተረጋግጥ', 'Meeshaale', 'Confirm Triage')}
                                </button>
                                <button type="button" onClick={() => setShowTriageForm(false)}
                                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-5 rounded-xl transition-all text-xs cursor-pointer">
                                  {L('ሰርዝ', 'Haqi', 'Cancel')}
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Doctor Assignment */}
                      <AnimatePresence>
                        {showDoctorAssign && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden border-t border-slate-100 pt-5 mt-5">
                            <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-5 space-y-4">
                              <h5 className="text-xs font-bold text-blue-950 uppercase tracking-wider flex items-center gap-2">
                                <Stethoscope className="w-4 h-4" /> {L('ንቁ ዶክተር ይምረጡ', 'Oppii Doktera Filadhaa', 'Select Active Doctor')}
                              </h5>
                              {activeDoctors.length === 0 ? (
                                <div className="bg-white border border-blue-100 rounded-xl p-6 text-center">
                                  <Stethoscope className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                                  <p className="text-sm font-bold text-slate-600">{L('ምንም ንቁ ዶክተር የለም', 'Oppii Dokteraa Hin Jiru', 'No Active Doctors')}</p>
                                  <p className="text-xs text-slate-400 mt-1">{L('ዶክተሮች ሲጀምሩ እዚህ ይታያሉ።', 'Doktoorni eegalan asitti mul\'atu.', 'Doctors appear here when they start their shift.')}</p>
                                </div>
                              ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  {activeDoctors.map((doc) => (
                                    <button key={doc.id} type="button" disabled={loadingAction} onClick={() => handleAssignDoctor(doc)}
                                      className="bg-white border border-blue-200 hover:border-blue-500 hover:bg-blue-50 rounded-xl p-4 text-left transition-all cursor-pointer group">
                                      <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm group-hover:bg-blue-600 group-hover:text-white transition-all">
                                          <Stethoscope className="w-5 h-5" />
                                        </div>
                                        <div>
                                          <div className="text-sm font-bold text-slate-800">{doc.doctorName}</div>
                                          <div className="text-[10px] text-slate-400 font-semibold">{doc.room} • {doc.department}</div>
                                        </div>
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              )}
                              <button type="button" onClick={() => setShowDoctorAssign(false)}
                                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 px-4 rounded-xl transition-all text-xs cursor-pointer">
                                {L('ተመ돌', 'Deebi', 'Back')}
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10 space-y-5 text-center">
                      <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
                        <UserCheck className="w-8 h-8" />
                      </div>
                      <div className="max-w-xs space-y-1">
                        <h5 className="font-extrabold text-slate-700">{L('ዴስኩ ባዶ ነው', 'Deskii Duwwaadha', 'Counter Empty')}</h5>
                        <p className="text-xs text-slate-400">{L('ቀጣዩን ታካሚ በራስ-ሰር ይጠራል።', 'Dhukkubsataa itti aanu of-awaalaa waamaa.', 'Next patient will be called automatically.')}</p>
                      </div>
                      {waitingPatients.length > 0 && (
                        <div className="text-xs text-slate-400 font-semibold flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 animate-spin" /> {L(`የመጠባበቂያ ${waitingPatients.length} ታካሚ አለ`, `${waitingPatients.length} dhukkubsataa eegachaa jira`, `${waitingPatients.length} waiting`)}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-md relative overflow-hidden">
                <div className="absolute right-0 top-0 w-24 h-24 bg-white/5 rounded-full blur-xl"></div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">{L('የመጠባበቂያ ክፍል ሁኔታ', 'Haala Lobby', 'Lobby Status')}</h4>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-5xl font-black font-sans tracking-tight">{waitingPatients.length}</span>
                  <span className="text-xs text-slate-300 font-bold uppercase tracking-wider">{L('በመጠባበቂያ ላይ', 'Eeggachaa', 'Waiting')}</span>
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-slate-500" />
                    <span className="text-xs font-black text-slate-700 uppercase tracking-wider">{L('የመጠባበቂያ ወረፋ', 'Tarree Eeggatootaa', 'Queue')}</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                    {L('በቲኬት ተрак', 'Tartiiba Tikkee', 'By Ticket')}
                  </span>
                </div>
                <div className="divide-y divide-slate-50 p-3 max-h-[420px] overflow-y-auto">
                  {waitingPatients.length === 0 ? (
                    <div className="text-center py-10 text-xs text-slate-400 space-y-1">
                      <p className="font-bold">{L('ወረፋው ባዶ ነው', 'Tarreen Duwwaadha', 'Queue Empty')}</p>
                      <p>{L('አዲስ ታካሚ ሲመዘገብ እዚህ ይዘረዘራል።', 'Dhukkubsattonni haaraa galmeeffaman asitti mul\'atu.', 'New check-ins appear here.')}</p>
                    </div>
                  ) : (
                    waitingPatients.slice(0, 8).map((p, idx) => {
                      const style = getPriorityStyles(p.triagePriority);
                      return (
                        <div key={p.id} className="p-3 hover:bg-slate-50/50 rounded-2xl transition-all flex items-center justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded">{idx + 1}</span>
                              <span className="text-xs font-mono font-black text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">{p.id}</span>
                              <span className="text-xs font-bold text-slate-800 line-clamp-1">{p.name}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-semibold">
                              <span>{p.age}y • {p.gender === 'Male' ? 'M' : 'F'}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
                {waitingPatients.length > 8 && (
                  <div className="p-3 bg-slate-50 border-t border-slate-100 text-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    + {waitingPatients.length - 8} {L('ተጨማሪ', 'Biroo', 'more')}
                  </div>
                )}
              </div>

              {/* Active Doctors Panel */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-50 bg-slate-50/30 flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-black text-slate-700 uppercase tracking-wider">{L('ንቁ ዶክተሮች', 'Doktoorota', 'Active Doctors')}</span>
                </div>
                <div className="p-3 space-y-2">
                  {activeDoctors.length === 0 ? (
                    <div className="text-center py-6 text-[10px] text-slate-400 font-bold">{L('ምንም ዶክተር የለም', 'Dokteraa Hin Jiru', 'No active doctors')}</div>
                  ) : (
                    activeDoctors.map((doc) => (
                      <div key={doc.id} className="p-2.5 bg-emerald-50/50 border border-emerald-100 rounded-xl flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                          <Stethoscope className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-[11px] font-bold text-slate-800">{doc.doctorName}</div>
                          <div className="text-[9px] text-slate-400 font-semibold">{doc.room} • {doc.department}</div>
                        </div>
                        <div className="ml-auto w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
