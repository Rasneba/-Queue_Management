'use client';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, UserCheck, Clock, ShieldAlert, Play, CheckCircle, 
  RefreshCw, LogOut, Ticket, PauseCircle, Send, ArrowRight,
  ChevronRight, Volume2, VolumeX, Search, Info, HelpCircle, Lock, Eye, EyeOff,
  AlertCircle
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

const PRESET_COUNTERS = [
  "Reception 1",
  "Reception 2",
  "Reception 3",
  "Reception 4"
];

const DEPARTMENTS: Department[] = [
  'General Medicine', 'Pediatrics', 'Cardiology', 'Orthopedics', 'Emergency',
  'Neurology', 'Oncology', 'Gynecology', 'Ophthalmology', 'ENT',
  'Dermatology', 'Radiology', 'Laboratory', 'Pharmacy'
];

export default function ReceptionConsole({ patients, onUpdatePatients, language = 'en', isOffline = false }: ReceptionConsoleProps) {
  const [counterName, setCounterName] = useState<string>(() => {
    return localStorage.getItem('reception_counter_name') || "";
  });
  const [selectedPreset, setSelectedPreset] = useState<string>("Reception 1");
  const [customCounter, setCustomCounter] = useState<string>("");
  const [loadingAction, setLoadingAction] = useState(false);
  const [transferringId, setTransferringId] = useState<string | null>(null);
  const [targetDept, setTargetDept] = useState<Department>('General Medicine');

  const [password, setPassword] = useState<string>("");
  const [passwordError, setPasswordError] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const [audioEnabled, setAudioEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('reception_tts_enabled') === 'true';
    }
    return false;
  });
  const [ttsLang, setTtsLang] = useState<'en' | 'am' | 'om'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('reception_tts_lang') as 'en' | 'am' | 'om') || 'am';
    }
    return 'am';
  });

  useEffect(() => {
    preloadVoices();
  }, []);

  useEffect(() => {
    localStorage.setItem('reception_tts_enabled', String(audioEnabled));
  }, [audioEnabled]);

  useEffect(() => {
    localStorage.setItem('reception_tts_lang', ttsLang);
  }, [ttsLang]);

  const handleLogin = (name: string) => {
    const finalName = name.trim();
    if (!finalName) {
      setPasswordError(
        language === 'am' ? "እባክዎ የመቀበያ ክፍል ወይም ዴስክ ይምረጡ።" : 
        language === 'om' ? "Maaloo deskii keessan filadhaa." : 
        "Please specify a counter or desk."
      );
      return;
    }

    if (!password) {
      setPasswordError(
        language === 'am' ? "የይለፍ ቃል ያስፈልጋል።" : 
        language === 'om' ? "Fungurri barbaachisaadha." : 
        "Password is required."
      );
      return;
    }

    if (password !== 'reception123' && password !== 'admin') {
      setPasswordError(
        language === 'am' ? "የይለፍ ቃል የተሳሳተ ነው። ፍንጭ፦ 'reception123' ወይም 'admin' ይጠቀሙ" : 
        language === 'om' ? "Fungurri dogoggora. Hint: 'reception123' ykn 'admin' fayyadamaa" : 
        "Incorrect password. Hint: Use 'reception123' or 'admin'"
      );
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

  const priorityLevelOrder = {
    'VIP': 3,
    'Urgent': 2,
    'Standard': 1
  };

  const priorityOrder: Record<Priority, number> = {
    'Emergency': 4,
    'High': 3,
    'Medium': 2,
    'Low': 1
  };

  const waitingPatients = useMemo(() => patients
    .filter(p => p.status === 'Waiting')
    .sort((a, b) => {
      const levelA = priorityLevelOrder[a.priorityLevel || 'Standard'] || 1;
      const levelB = priorityLevelOrder[b.priorityLevel || 'Standard'] || 1;
      if (levelA !== levelB) return levelB - levelA;

      const pA = priorityOrder[a.triagePriority];
      const pB = priorityOrder[b.triagePriority];
      if (pA !== pB) return pB - pA;
      if (b.triageScore !== a.triageScore) return b.triageScore - a.triageScore;
      return new Date(a.checkInTime).getTime() - new Date(b.checkInTime).getTime();
    }), [patients]);

  const currentPatient = useMemo(() => patients.find(p => 
    p.assignedRoom === counterName && 
    (p.status === 'Called' || p.status === 'Serving')
  ), [patients, counterName]);

  const handleUpdatePriorityLevel = async (patientId: string, level: 'Standard' | 'Urgent' | 'VIP') => {
    setLoadingAction(true);
    try {
      const response = await fetch('/api/patients/override', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: patientId, priorityLevel: level })
      });
      if (response.ok) {
        onUpdatePatients();
      }
    } catch (err) {
      console.error("Error updating priority level:", err);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleCallPatient = async (patientId: string, dept?: Department) => {
    setLoadingAction(true);
    try {
      const response = await fetch('/api/patients/call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: patientId, room: counterName })
      });
      if (response.ok) {
        playPleasantChime();
        if (audioEnabled) {
          setTimeout(() => {
            speakTicket(patientId, counterName, { lang: ttsLang, department: dept });
          }, 1200);
        }
        onUpdatePatients();
      }
    } catch (err) {
      console.error("Error calling patient:", err);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleNextPatient = async () => {
    if (waitingPatients.length === 0) return;
    
    if (currentPatient) {
      await handleCompletePatient(currentPatient.id);
    }

    const nextUp = waitingPatients[0];
    await handleCallPatient(nextUp.id, nextUp.recommendedDepartment);
  };

  const handleRecallPatient = async () => {
    if (!currentPatient) return;
    setLoadingAction(true);
    try {
      const response = await fetch('/api/patients/call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: currentPatient.id, room: counterName })
      });
      if (response.ok) {
        playPleasantChime();
        if (audioEnabled) {
          setTimeout(() => {
            speakTicket(currentPatient.id, counterName, { lang: ttsLang, department: currentPatient.recommendedDepartment });
          }, 1200);
        }
        onUpdatePatients();
      }
    } catch (err) {
      console.error("Error recalling patient:", err);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleHoldPatient = async () => {
    if (!currentPatient) return;
    setLoadingAction(true);
    try {
      const response = await fetch('/api/patients/hold', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: currentPatient.id })
      });
      if (response.ok) {
        onUpdatePatients();
      }
    } catch (err) {
      console.error("Error holding patient:", err);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleTransferPatient = async (patientId: string, dept: Department) => {
    setLoadingAction(true);
    try {
      const response = await fetch('/api/patients/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: patientId, 
          recommendedDepartment: dept,
          status: "Waiting",
          assignedRoom: null
        })
      });
      if (response.ok) {
        setTransferringId(null);
        onUpdatePatients();
      }
    } catch (err) {
      console.error("Error transferring patient:", err);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleCompletePatient = async (patientId: string) => {
    setLoadingAction(true);
    try {
      const response = await fetch('/api/patients/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: patientId })
      });
      if (response.ok) {
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
      const response = await fetch('/api/patients/serve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: patientId })
      });
      if (response.ok) {
        onUpdatePatients();
      }
    } catch (err) {
      console.error("Error serving patient:", err);
    } finally {
      setLoadingAction(false);
    }
  };

  const getPriorityStyles = (p: Priority) => {
    switch(p) {
      case 'Emergency':
        return { bg: 'bg-rose-50 border-rose-100', text: 'text-rose-700', badge: 'bg-rose-600 text-white' };
      case 'High':
        return { bg: 'bg-orange-50 border-orange-100', text: 'text-orange-700', badge: 'bg-orange-500 text-white' };
      case 'Medium':
        return { bg: 'bg-amber-50 border-amber-100', text: 'text-amber-700', badge: 'bg-amber-500 text-white' };
      case 'Low':
      default:
        return { bg: 'bg-emerald-50 border-emerald-100', text: 'text-emerald-700', badge: 'bg-emerald-600 text-white' };
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {isOffline && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-rose-50 border border-rose-200/60 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-rose-800 text-xs font-semibold shadow-sm"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse flex-shrink-0" />
            <span>
              <strong>{language === 'am' ? 'ከመስመር ውጭ፦' : language === 'om' ? 'Offline:' : 'Offline Mode:'}</strong>{' '}
              {language === 'am' ? 'የአገልጋይ ግንኙነት ተቋርጧል። የመረጃ ማመሳሰል እየተሞከረ ነው...' : language === 'om' ? 'Gergariin citeera. Sinkii gochuuf yaalamaa jira...' : 'Connection to the server has been lost. Attempting to re-establish server sync...'}
            </span>
          </div>
          <button
            type="button"
            onClick={onUpdatePatients}
            className="px-3.5 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-900 rounded-xl font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            {language === 'am' ? 'እንደገና ሞክር' : language === 'om' ? 'Yaali' : 'Retry Now'}
          </button>
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {!counterName ? (
          <motion.div
            key="login"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="max-w-md mx-auto bg-white rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-slate-100 overflow-hidden mt-10"
          >
            <div className="bg-gradient-to-r from-blue-700 to-blue-800 p-8 text-white text-center relative overflow-hidden">
              <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
              <div className="flex justify-center items-center gap-3 mb-2 relative z-10">
                <Ticket className="w-8 h-8 text-blue-100 animate-pulse" />
                <h2 className="text-2xl font-extrabold font-sans tracking-tight">
                  {language === 'am' ? 'የመቀበያ ሰራተኛ መግቢያ' : language === 'om' ? 'Seensa Simattuu' : 'Receptionist Login'}
                </h2>
              </div>
              <p className="text-blue-100 text-xs font-semibold uppercase tracking-wider relative z-10">
                {language === 'am' ? 'ወደ ዴስክዎ ይግቡ' : language === 'om' ? 'Gara deskii keessanii seenaa' : 'Sign in to your counter desk'}
              </p>
            </div>

            {isOffline && (
              <div className="bg-rose-50 border-b border-rose-100 px-8 py-3 flex items-center justify-center gap-2 text-rose-700 text-xs font-bold animate-pulse">
                <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                <span>
                  {language === 'am' ? 'የአገልጋይ ግንኙነት ተቋርጧል። ከመስመር ውጭ ነው' : language === 'om' ? 'Gergariin citeera. Offline dha' : 'Server connection lost. You are currently offline'}
                </span>
              </div>
            )}

            <div className="p-8 space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2.5">
                  {language === 'am' ? 'የመቀበያ ክፍል / ዴስክ ይምረጡ' : language === 'om' ? 'Deskii Keessan Filadhaa' : 'Select Your Counter / Desk'}
                </label>
                <div className="grid grid-cols-2 gap-3.5">
                  {PRESET_COUNTERS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        setSelectedPreset(preset);
                        setCustomCounter("");
                      }}
                      className={`py-3.5 px-4 rounded-2xl border text-center font-bold text-sm transition-all duration-200 cursor-pointer ${
                        selectedPreset === preset && !customCounter
                          ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200'
                          : 'border-slate-100 text-slate-600 hover:border-blue-200 hover:bg-slate-50'
                      }`}
                    >
                      {preset.replace("Reception", language === 'am' ? "መቀበያ" : language === 'om' ? "Deskii" : "Reception")}
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-100"></div>
                <span className="flex-shrink mx-4 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                  {language === 'am' ? 'ወይም ሌላ ክፍል መግለጫ' : language === 'om' ? 'Yookaan deskii biroo' : 'Or custom counter'}
                </span>
                <div className="flex-grow border-t border-slate-100"></div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">
                  {language === 'am' ? 'የዴስክ ስም በእጅ ያስገቡ' : language === 'om' ? 'Maqaa deskii barreessa' : 'Enter Desk Name manually'}
                </label>
                <input
                  type="text"
                  placeholder={language === 'am' ? 'ለምሳሌ፦ መቀበያ ክፍል 5' : language === 'om' ? 'Fk. Deskii 5' : 'e.g. Reception Desk 5'}
                  value={customCounter}
                  onChange={(e) => {
                    setCustomCounter(e.target.value);
                    setSelectedPreset("");
                  }}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-sans"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                  {language === 'am' ? 'የዴስክ ይለፍ ቃል' : language === 'om' ? 'Fungurroo Deskii' : 'Desk Passcode / Password'}
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder={language === 'am' ? 'የመቀበያ ሰራተኛ የይለፍ ቃል ያስገቡ' : language === 'om' ? 'Fungurroo galchaa' : 'Enter receptionist password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setPasswordError("");
                    }}
                    className="w-full pl-10 pr-10 py-3 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-sans"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="mt-1.5 text-[10px] text-slate-400 font-medium">
                  {language === 'am' ? 'መደበኛ የይለፍ ቃል' : language === 'om' ? 'Fungurroon idilee' : 'Default password is'} <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-blue-600 font-bold">reception123</code> {language === 'am' ? 'ወይም' : language === 'om' ? 'yookaan' : 'or'} <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-blue-600 font-bold">admin</code>
                </p>
              </div>

              {passwordError && (
                <div className="bg-rose-50 border border-rose-100 p-3.5 rounded-xl flex items-center gap-2.5 text-rose-700 text-xs font-semibold">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              <button
                type="button"
                onClick={() => handleLogin(customCounter || selectedPreset)}
                className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-3.5 rounded-2xl transition-colors flex items-center justify-center gap-2 shadow-md hover:shadow-lg hover:shadow-blue-200 cursor-pointer text-sm tracking-wide"
              >
                {language === 'am' ? 'ወደ ዴስክ ግባ' : language === 'om' ? 'Deskii Seenaa' : 'Sign In to Desk'} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-3xl border border-slate-100 p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                    <Ticket className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-800 tracking-tight font-sans">
                      {counterName.replace("Reception", language === 'am' ? "መቀበያ" : language === 'om' ? "Deskii" : "Reception")}
                    </h3>
                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                      {isOffline ? (
                        <>
                          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                          <span className="text-rose-600 font-bold">
                            {language === 'am' ? 'ከመስመር ውጭ (ግንኙነት ተቋርጧል)' : language === 'om' ? 'Offline (Sync Lost)' : 'Offline (Sync Lost)'}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                          <span>
                            {language === 'am' ? 'ለመጥራት እና ለማስተናገድ ዝግጁ' : language === 'om' ? 'Waamuufi Tajaajiluuf Qophii' : 'Ready to Call & Serve'}
                          </span>
                        </>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onUpdatePatients}
                    className="p-2.5 rounded-xl border border-slate-100 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                    title={language === 'am' ? 'ወረፋውን አድስ' : language === 'om' ? 'Haaromsi' : 'Refresh Queue'}
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-1 bg-slate-50 border border-slate-100 rounded-xl px-2 py-1">
                    <button
                      type="button"
                      onClick={() => {
                        if (!audioEnabled && 'speechSynthesis' in window) {
                          preloadVoices();
                        }
                        setAudioEnabled(!audioEnabled);
                        if (!audioEnabled && 'speechSynthesis' in window) {
                          const u = new SpeechSynthesisUtterance('test');
                          u.volume = 0.01;
                          u.lang = ttsLang === 'am' ? 'am-ET' : ttsLang === 'om' ? 'om-ET' : 'en-US';
                          window.speechSynthesis.speak(u);
                        } else {
                          stopSpeech();
                        }
                      }}
                      className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                        audioEnabled
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'text-slate-400 hover:text-slate-600'
                      }`}
                      title={audioEnabled
                        ? (language === 'am' ? 'የድምጽ ማስጠንቀቂያ አለ' : language === 'om' ? 'Aamii haquu' : 'Voice announcements ON')
                        : (language === 'am' ? 'የድምጽ ማስጠንቀቂያ ያለ' : language === 'om' ? 'Aamii geessuu' : 'Voice announcements OFF')
                      }
                    >
                      {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                    </button>
                    <select
                      value={ttsLang}
                      onChange={(e) => setTtsLang(e.target.value as 'en' | 'am' | 'om')}
                      className="text-[10px] font-bold bg-transparent outline-none cursor-pointer text-slate-600 pr-1"
                    >
                      <option value="en">EN</option>
                      <option value="am">አማ</option>
                      <option value="om">OM</option>
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-100 border border-transparent transition-all cursor-pointer uppercase tracking-wider"
                  >
                    <LogOut className="w-4 h-4" />
                    {language === 'am' ? 'ውጣ' : language === 'om' ? 'Bahi' : 'Sign Out'}
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-[32px] border border-slate-100 shadow-[0_15px_40px_rgba(0,0,0,0.02)] overflow-hidden">
                <div className="border-b border-slate-100 p-6 flex items-center justify-between bg-slate-50/50">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-blue-600" />
                    <h4 className="font-bold text-slate-800">
                      {language === 'am' ? 'የአሁኑ ትኬት' : language === 'om' ? 'Tikkee Ammaa' : 'Current Ticket'}
                    </h4>
                  </div>
                  {currentPatient && (
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      currentPatient.status === 'Serving' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {currentPatient.status === 'Serving' 
                        ? (language === 'am' ? 'ምርመራ ላይ' : language === 'om' ? 'Madaallii' : 'Serving') 
                        : (language === 'am' ? 'ተጠርቷል' : language === 'om' ? 'Waamamee' : 'Called')}
                    </span>
                  )}
                </div>

                <div className="p-8">
                  {currentPatient ? (
                    <div className="space-y-6">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-dashed border-slate-100 pb-6">
                        <div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                            {language === 'am' ? 'ንቁ የተጠራ ትኬት' : language === 'om' ? 'Tikkee Waamicha Ammaa' : 'Active Call Ticket'}
                          </div>
                          <div className="text-4xl font-black text-blue-800 tracking-tight mt-1">{currentPatient.id}</div>
                          <div className="text-base font-extrabold text-slate-800 mt-1.5">{currentPatient.name}</div>
                          <div className="text-xs text-slate-400 font-medium mt-0.5">
                            {language === 'am' ? 'ዕድሜ' : language === 'om' ? 'Umrii' : 'Age'} {currentPatient.age} • {currentPatient.gender === 'Male' ? t('male', language) : currentPatient.gender === 'Female' ? t('female', language) : t('other', language)}
                          </div>
                        </div>

                        <div className="text-right sm:text-right flex flex-row sm:flex-col gap-2 sm:gap-1.5 items-center sm:items-end">
                          <span className={`px-3 py-1 rounded-lg text-xs font-bold ${getPriorityStyles(currentPatient.triagePriority).badge}`}>
                            {currentPatient.triagePriority === 'Emergency' ? (language === 'am' ? 'አስቸኳይ' : language === 'om' ? 'Tasaa' : 'Emergency') :
                             currentPatient.triagePriority === 'High' ? (language === 'am' ? 'ከፍተኛ ቅድሚያ' : language === 'om' ? 'Dursa Guddaa' : 'High Priority') :
                             currentPatient.triagePriority === 'Medium' ? (language === 'am' ? 'መካከለኛ ቅድሚያ' : language === 'om' ? 'Dursa Giddu-galeessa' : 'Medium Priority') :
                             (language === 'am' ? 'መደበኛ ቅድሚያ' : language === 'om' ? 'Dursa Idilee' : 'Low Priority')}
                          </span>
                          <span className="text-xs text-slate-500 font-bold uppercase tracking-wider bg-slate-100 px-2 py-1 rounded">
                            {currentPatient.recommendedDepartment}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100/80">
                        <div>
                          <span className="text-xs font-extrabold text-slate-700 block uppercase tracking-wider">
                            {language === 'am' ? 'የታካሚ ቅድሚያ ደረጃ' : language === 'om' ? 'Sadarkaa Dursa Dhukkubsataa' : 'Patient Priority Level'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {language === 'am' ? 'ቅደም ተከተሉን በራስ-ሰር ለማስተካከል ምርጫ ይምረጡ' : language === 'om' ? 'Taliigee tartiiba jijjiiruf filadhaa' : 'Re-order queue dynamically by setting access type'}
                          </span>
                        </div>
                        <div className="flex bg-white p-1 rounded-xl border border-slate-200/60 shadow-sm self-start sm:self-center">
                          {(['Standard', 'Urgent', 'VIP'] as const).map((level) => {
                            const isActive = (currentPatient.priorityLevel || 'Standard') === level;
                            const levelColors = {
                              Standard: isActive ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50',
                              Urgent: isActive ? 'bg-amber-500 text-white shadow-sm' : 'text-amber-600 hover:text-amber-700 hover:bg-amber-50/40',
                              VIP: isActive ? 'bg-indigo-600 text-white shadow-sm' : 'text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50/40'
                            };
                            return (
                              <button
                                key={level}
                                type="button"
                                disabled={loadingAction}
                                onClick={() => handleUpdatePriorityLevel(currentPatient.id, level)}
                                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                                  levelColors[level]
                                }`}
                              >
                                {level}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-3">
                        <div className="flex items-start gap-2.5 text-xs text-slate-600 leading-relaxed">
                          <span className="font-bold text-slate-800 min-w-16">
                            {language === 'am' ? 'የህመም ምልክቶች' : language === 'om' ? 'Mallattoolee' : 'Symptoms'}:
                          </span>
                          <span className="italic">"{currentPatient.symptoms}"</span>
                        </div>
                        {currentPatient.aiAnalysis?.clinicalPrecaution && (
                          <div className="flex items-start gap-2.5 text-xs text-rose-700 leading-relaxed bg-rose-50/50 p-2.5 rounded-lg border border-rose-100/30">
                            <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <span>
                              <strong className="font-bold">
                                {language === 'am' ? 'ጥንቃቄ ለሰራተኞች' : language === 'om' ? 'Beeksisa Of-eeggannoo' : 'Staff Alert'}:
                              </strong> {currentPatient.aiAnalysis.clinicalPrecaution}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5 pt-2">
                        {currentPatient.status === 'Called' ? (
                          <button
                            type="button"
                            disabled={loadingAction}
                            onClick={() => handleServePatient(currentPatient.id)}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold p-3 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all text-xs text-center cursor-pointer shadow-md shadow-blue-100"
                          >
                            <Play className="w-4 h-4" />
                            {language === 'am' ? 'አገልግል' : language === 'om' ? 'Tajaajili' : 'Serve'}
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={loadingAction}
                            onClick={() => handleCompletePatient(currentPatient.id)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold p-3 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all text-xs text-center cursor-pointer shadow-md shadow-emerald-100 col-span-1"
                          >
                            <CheckCircle className="w-4 h-4" />
                            {language === 'am' ? 'ጨርስ' : language === 'om' ? 'Xumuri' : 'Complete'}
                          </button>
                        )}

                        <button
                          type="button"
                          disabled={loadingAction}
                          onClick={handleRecallPatient}
                          className="border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold p-3 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all text-xs text-center cursor-pointer"
                        >
                          <Volume2 className="w-4 h-4 text-blue-600" />
                          {language === 'am' ? 'ደግመህ ጥራ' : language === 'om' ? 'Irra-deebi' : 'Recall'}
                        </button>

                        <button
                          type="button"
                          disabled={loadingAction}
                          onClick={handleHoldPatient}
                          className="border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold p-3 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all text-xs text-center cursor-pointer"
                        >
                          <PauseCircle className="w-4 h-4 text-amber-500" />
                          {language === 'am' ? 'አቆይ' : language === 'om' ? 'Tursi' : 'Hold'}
                        </button>

                        <button
                          type="button"
                          disabled={loadingAction}
                          onClick={() => setTransferringId(transferringId === currentPatient.id ? null : currentPatient.id)}
                          className={`border border-slate-200 font-bold p-3 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all text-xs text-center cursor-pointer ${
                            transferringId === currentPatient.id ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <Send className="w-4 h-4 text-indigo-500" />
                          {language === 'am' ? 'አስተላልፍ' : language === 'om' ? 'Dabarsi' : 'Transfer'}
                        </button>

                        {currentPatient.status === 'Serving' ? (
                          <button
                            type="button"
                            disabled={loadingAction}
                            onClick={handleNextPatient}
                            className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-100 font-bold p-3 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all text-xs text-center cursor-pointer col-span-2 sm:col-span-1"
                          >
                            <ChevronRight className="w-4 h-4 text-blue-700" />
                            {language === 'am' ? 'ቀጣይ' : language === 'om' ? 'Itti aanu' : 'Next'}
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={loadingAction}
                            onClick={() => handleCompletePatient(currentPatient.id)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold p-3 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all text-xs text-center cursor-pointer shadow-md shadow-emerald-100 col-span-2 sm:col-span-1"
                          >
                            <CheckCircle className="w-4 h-4" />
                            {language === 'am' ? 'ጨርስ' : language === 'om' ? 'Xumuri' : 'Complete'}
                          </button>
                        )}
                      </div>

                      <AnimatePresence>
                        {transferringId === currentPatient.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden border-t border-slate-100 pt-5 mt-5"
                          >
                            <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4 space-y-3">
                              <h5 className="text-xs font-bold text-indigo-950 uppercase tracking-wider">
                                {language === 'am' ? 'ታካሚ ወደ ሌላ ልዩ ክፍል ያስተላልፉ' : language === 'om' ? 'Dhukkubsataa gara kutaa birootti dabarsaa' : 'Transfer Patient to Specialist Department'}
                              </h5>
                              <div className="flex flex-wrap gap-2">
                                {DEPARTMENTS.map((dept) => (
                                  <button
                                    key={dept}
                                    type="button"
                                    onClick={() => handleTransferPatient(currentPatient.id, dept)}
                                    className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:border-indigo-500 hover:bg-indigo-50 text-xs font-bold cursor-pointer transition-all"
                                  >
                                    {dept}
                                  </button>
                                ))}
                              </div>
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
                        <h5 className="font-extrabold text-slate-700">
                          {language === 'am' ? 'ዴስኩ በአሁኑ ጊዜ ባዶ ነው' : language === 'om' ? 'Deskii Amma Duwwaadha' : 'Counter is Currently Empty'}
                        </h5>
                        <p className="text-xs text-slate-400">
                          {language === 'am' ? 'እዚህ የተመደበ ታካሚ የለም። ቀጣዩን ታካሚ ለመጥራት ከታች ያለውን ቁልፍ ይጫኑ።' : language === 'om' ? 'Tikkeen asitti hin ramadamne. Tajaajila jalqabuuf dhukkubsataa itti aanu waamaa.' : 'There is no ticket assigned here. Call the next patient in line to start service.'}
                        </p>
                      </div>

                      <button
                        type="button"
                        disabled={loadingAction || waitingPatients.length === 0}
                        onClick={handleNextPatient}
                        className="w-full max-w-xs bg-blue-600 hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-extrabold py-3.5 px-6 rounded-2xl transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg hover:shadow-blue-100 cursor-pointer text-sm"
                      >
                        <Play className="w-4 h-4 fill-white" />
                        {language === 'am' ? `ቀጣይ ታካሚ ጥራ (${waitingPatients.length} በመጠባበቅ ላይ)` : language === 'om' ? `Dhukkubsataa Itti aanu Waamaa (${waitingPatients.length} Eeggachaa jiru)` : `Call Next Patient (${waitingPatients.length} Waiting)`}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-md relative overflow-hidden">
                <div className="absolute right-0 top-0 w-24 h-24 bg-white/5 rounded-full blur-xl"></div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  {language === 'am' ? 'የመጠባበቂያ ክፍል ሁኔታ' : language === 'om' ? 'Haala Lobby Eeggachuu' : 'Main Lobby Status'}
                </h4>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-5xl font-black font-sans tracking-tight">{waitingPatients.length}</span>
                  <span className="text-xs text-slate-300 font-bold uppercase tracking-wider">
                    {language === 'am' ? 'በመጠባበቂያ ላይ ያሉ' : language === 'om' ? 'Lobby keessatti eeggachaa kan jiran' : 'Waiting in Lobby'}
                  </span>
                </div>
                <div className="text-xs text-slate-400 mt-3 font-medium flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {language === 'am' ? 'ፈጣን የቅድሚያ መደብ ሂደት ንቁ ነው' : language === 'om' ? 'Saffisaan madaallii & dursa kennuun hojjachaa jira' : 'Fastest triage dispatch in progress • Priority routing active'}
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-slate-500" />
                    <span className="text-xs font-black text-slate-700 uppercase tracking-wider">
                      {language === 'am' ? 'የመጠባበቂያ ክፍል ወረፋ' : language === 'om' ? 'Tarree Eeggatootaa' : 'Lobby Queue'}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">Top 5</span>
                </div>

                <div className="divide-y divide-slate-50 p-3 max-h-[420px] overflow-y-auto">
                  {waitingPatients.length === 0 ? (
                    <div className="text-center py-10 text-xs text-slate-400 space-y-1">
                      <p className="font-bold">
                        {language === 'am' ? 'ወረፋው ባዶ ነው' : language === 'om' ? 'Tarreen Duwwaadha' : 'Lobby Queue is Empty'}
                      </p>
                      <p>
                        {language === 'am' ? 'አዲስ ታካሚ ሲመዘገብ እዚህ ይዘረዘራል።' : language === 'om' ? 'Dhukkubsattonni haaraa galmeeffaman asitti mul\'atu.' : 'New arrivals from Check-In will appear here.'}
                      </p>
                    </div>
                  ) : (
                    waitingPatients.slice(0, 5).map((p, idx) => {
                      const style = getPriorityStyles(p.triagePriority);
                      return (
                        <div key={p.id} className="p-3 hover:bg-slate-50/50 rounded-2xl transition-all duration-150 flex items-center justify-between gap-3 group">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-mono font-black text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                                {p.id}
                              </span>
                              <span className="text-xs font-bold text-slate-800 line-clamp-1">{p.name}</span>
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-400 font-semibold">
                              <span>{language === 'am' ? 'ዕድሜ' : language === 'om' ? 'Umrii' : 'Age'} {p.age} • {p.gender === 'Male' ? t('male', language) : p.gender === 'Female' ? t('female', language) : t('other', language)}</span>
                              <span>•</span>
                              <span className={`px-1.5 py-0.5 rounded-md ${style.bg} ${style.text} text-[9px] font-extrabold uppercase`}>
                                {p.triagePriority === 'Emergency' ? (language === 'am' ? 'አስቸኳይ' : language === 'om' ? 'Tasaa' : 'Emergency') :
                                 p.triagePriority === 'High' ? (language === 'am' ? 'ከፍተኛ' : language === 'om' ? 'Guddaa' : 'High') :
                                 p.triagePriority === 'Medium' ? (language === 'am' ? 'መካከለኛ' : language === 'om' ? 'Giddu-galeessa' : 'Medium') :
                                 (language === 'am' ? 'ዝቅተኛ' : language === 'om' ? 'Gadaanaa' : 'Low')}
                              </span>
                              <span>•</span>
                              <select
                                value={p.priorityLevel || 'Standard'}
                                disabled={loadingAction}
                                onChange={(e) => handleUpdatePriorityLevel(p.id, e.target.value as any)}
                                className={`text-[9px] font-bold uppercase rounded border px-1 py-0.5 outline-none cursor-pointer transition-colors ${
                                  p.priorityLevel === 'VIP'
                                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-black'
                                    : p.priorityLevel === 'Urgent'
                                      ? 'bg-amber-50 border-amber-200 text-amber-700 font-black'
                                      : 'bg-slate-50 border-slate-200 text-slate-500'
                                }`}
                              >
                                <option value="Standard">{language === 'am' ? 'መደበኛ' : language === 'om' ? 'Idilee' : 'Standard'}</option>
                                <option value="Urgent">{language === 'am' ? 'አስቸኳይ' : language === 'om' ? 'Ariifachiisaa' : 'Urgent'}</option>
                                <option value="VIP">{language === 'am' ? 'VIP (ልዩ)' : language === 'om' ? 'VIP' : 'VIP'}</option>
                              </select>
                            </div>
                          </div>

                          <button
                            type="button"
                            disabled={loadingAction}
                            onClick={() => handleCallPatient(p.id, p.recommendedDepartment)}
                            className="bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 font-bold py-1.5 px-3 rounded-xl transition-all text-[10px] uppercase tracking-wider cursor-pointer flex-shrink-0"
                          >
                            {language === 'am' ? 'ጥራ' : language === 'om' ? 'Waami' : 'Call'}
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>

                {waitingPatients.length > 5 && (
                  <div className="p-3 bg-slate-50 border-t border-slate-100 text-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    + {waitingPatients.length - 5} {language === 'am' ? 'ተጨማሪ ታካሚዎች በወረፋ ላይ' : language === 'om' ? 'Dhukkubsattonni biroo tarree keessa jiru' : 'More patients in queue'}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
