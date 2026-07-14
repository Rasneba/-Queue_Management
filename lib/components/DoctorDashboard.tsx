'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users, UserCheck, Stethoscope, Clock, ShieldAlert,
  Search, Filter, Play, CheckCircle, Ban, ArrowRight,
  RefreshCw, Sliders, ChevronRight, HelpCircle, HeartHandshake, Info,
  Volume2, VolumeX, User, Timer, Calendar, History, Trash2, Briefcase
} from 'lucide-react';
import { Patient, Priority, Department, PatientStatus, ShiftLog } from '@/lib/types';
import { playPleasantChime } from '@/lib/utils/audio';
import { speakTicket, stopSpeech, isSpeaking, preloadVoices } from '@/lib/utils/tts';

interface DoctorDashboardProps {
  patients: Patient[];
  onUpdatePatients: () => void;
  onResetDatabase: () => void;
}

const AVAILABLE_ROOMS = [
  "Room 1", "Room 2", "Room 3", "Room 4", 
  "Pediatric Suite A", "Cardiology Lab", "Orthopedic Room 1", "Trauma Room 1", "Trauma Room 2"
];

export default function DoctorDashboard({ patients, onUpdatePatients, onResetDatabase }: DoctorDashboardProps) {
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<PatientStatus>('Waiting');
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("All");
  const [selectedRoom, setSelectedRoom] = useState(AVAILABLE_ROOMS[0]);
  const [loadingAction, setLoadingAction] = useState(false);
  const [manualPriority, setManualPriority] = useState<Priority>('Medium');
  const [manualDepartment, setManualDepartment] = useState<Department>('General Medicine');
  const [showOverridePanel, setShowOverridePanel] = useState(false);

  // Shift tracking states
  const [activeShift, setActiveShift] = useState<ShiftLog | null>(() => {
    const saved = localStorage.getItem('active_doctor_shift');
    return saved ? JSON.parse(saved) : null;
  });

  const [shiftLogs, setShiftLogs] = useState<ShiftLog[]>(() => {
    const saved = localStorage.getItem('doctor_shift_logs');
    return saved ? JSON.parse(saved) : [];
  });

  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  // Doctor shift form fields
  const [docName, setDocName] = useState(() => localStorage.getItem('last_doctor_name') || "Dr. Alex Carter");
  const [docRoom, setDocRoom] = useState(AVAILABLE_ROOMS[0]);
  const [docDept, setDocDept] = useState<Department>("General Medicine");

  // Show shift history panel
  const [showShiftHistory, setShowShiftHistory] = useState(false);

  useEffect(() => {
    if (!activeShift) {
      setElapsedSeconds(0);
      return;
    }

    const calculateElapsed = () => {
      const start = new Date(activeShift.startTime).getTime();
      const now = new Date().getTime();
      return Math.max(0, Math.floor((now - start) / 1000));
    };

    setElapsedSeconds(calculateElapsed());

    const interval = setInterval(() => {
      setElapsedSeconds(calculateElapsed());
    }, 1000);

    return () => clearInterval(interval);
  }, [activeShift]);

  const formatElapsed = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleStartShift = () => {
    if (!docName.trim()) return;
    localStorage.setItem('last_doctor_name', docName.trim());

    const newShift: ShiftLog = {
      id: `shift_${Date.now()}`,
      doctorName: docName.trim(),
      room: docRoom,
      department: docDept,
      startTime: new Date().toISOString(),
      endTime: null,
      durationMinutes: 0,
      patientsTreated: []
    };

    setActiveShift(newShift);
    localStorage.setItem('active_doctor_shift', JSON.stringify(newShift));
  };

  const handleEndShift = () => {
    if (!activeShift) return;

    const endTimeISO = new Date().toISOString();
    const startTimeMs = new Date(activeShift.startTime).getTime();
    const endTimeMs = new Date(endTimeISO).getTime();
    const durationMin = Math.round((endTimeMs - startTimeMs) / 60000);

    const completedShift: ShiftLog = {
      ...activeShift,
      endTime: endTimeISO,
      durationMinutes: Math.max(1, durationMin)
    };

    const updatedLogs = [completedShift, ...shiftLogs];
    setShiftLogs(updatedLogs);
    localStorage.setItem('doctor_shift_logs', JSON.stringify(updatedLogs));

    setActiveShift(null);
    localStorage.removeItem('active_doctor_shift');
  };

  const handleClearHistory = () => {
    if (window.confirm("Are you sure you want to clear all shift logs?")) {
      setShiftLogs([]);
      localStorage.removeItem('doctor_shift_logs');
    }
  };

  const [audioEnabled, setAudioEnabled] = useState(() => {
    const saved = localStorage.getItem('doctor_audio_alert_enabled');
    return saved !== null ? saved === 'true' : true;
  });

  const [ttsEnabled, setTtsEnabled] = useState(() => {
    const saved = localStorage.getItem('doctor_tts_enabled');
    return saved !== null ? saved === 'true' : true;
  });

  const [ttsLang, setTtsLang] = useState<'en' | 'am' | 'om'>(() => {
    const saved = localStorage.getItem('doctor_tts_lang');
    return (saved === 'am' || saved === 'om' || saved === 'en') ? saved : 'am';
  });

  const toggleAudio = () => {
    setAudioEnabled(prev => {
      const next = !prev;
      localStorage.setItem('doctor_audio_alert_enabled', String(next));
      if (next) {
        playPleasantChime();
      }
      return next;
    });
  };

  // Filter patients based on tab, search term, and department
  const filteredPatients = patients.filter(patient => {
    const matchesTab = patient.status === activeTab;
    const matchesSearch = patient.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          patient.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = departmentFilter === "All" || patient.recommendedDepartment === departmentFilter;
    return matchesTab && matchesSearch && matchesDept;
  });

  const selectedPatient = patients.find(p => p.id === selectedPatientId) || filteredPatients[0];

  const handleCallPatient = async (id: string) => {
    setLoadingAction(true);
    try {
      await fetch('/api/patients/call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, room: selectedRoom })
      });
      if (audioEnabled) {
        playPleasantChime();
      }
      if (ttsEnabled) {
        const patient = patients.find(p => p.id === id);
        const dept = patient?.recommendedDepartment;
        const roomNum = selectedRoom.replace(/[^0-9]/g, '') || '1';
        const delay = audioEnabled ? 1200 : 300;
        setTimeout(() => {
          speakTicket(id, roomNum, { lang: ttsLang, department: dept });
        }, delay);
      }
      onUpdatePatients();
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleServePatient = async (id: string) => {
    setLoadingAction(true);
    try {
      await fetch('/api/patients/serve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      onUpdatePatients();
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleCompletePatient = async (id: string) => {
    setLoadingAction(true);
    try {
      await fetch('/api/patients/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });

      // If there is an active shift, add this patient to the shift's treated list
      if (activeShift) {
        setActiveShift(prev => {
          if (!prev) return null;
          const updatedTreated = prev.patientsTreated.includes(id)
            ? prev.patientsTreated
            : [...prev.patientsTreated, id];
          const newShift = { ...prev, patientsTreated: updatedTreated };
          localStorage.setItem('active_doctor_shift', JSON.stringify(newShift));
          return newShift;
        });
      }

      onUpdatePatients();
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleNoShowPatient = async (id: string) => {
    setLoadingAction(true);
    try {
      await fetch('/api/patients/no-show', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      onUpdatePatients();
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleOverrideTriage = async (id: string) => {
    setLoadingAction(true);
    try {
      await fetch('/api/patients/override', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          triagePriority: manualPriority,
          recommendedDepartment: manualDepartment,
          triageScore: manualPriority === 'Emergency' ? 5 : manualPriority === 'High' ? 4 : manualPriority === 'Medium' ? 3 : 1
        })
      });
      setShowOverridePanel(false);
      onUpdatePatients();
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAction(false);
    }
  };

  // Quick stats
  const waitingCount = patients.filter(p => p.status === 'Waiting').length;
  const calledCount = patients.filter(p => p.status === 'Called').length;
  const servingCount = patients.filter(p => p.status === 'Serving').length;
  const completedCount = patients.filter(p => p.status === 'Completed').length;

  return (
    <div id="doctor-dashboard" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* LEFT COLUMN: Queue Lists (7 cols) */}
      <div className="lg:col-span-7 space-y-5">
        {/* Shift Tracking Station */}
        <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm space-y-4">
          {!activeShift ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-400"></div>
                  <h4 className="text-sm font-extrabold text-slate-800 font-sans tracking-tight">Shift Control: Doctor Workstation</h4>
                </div>
                <button
                  type="button"
                  onClick={() => setShowShiftHistory(!showShiftHistory)}
                  className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 hover:text-blue-600 uppercase tracking-wide transition-colors"
                >
                  <History className="w-3.5 h-3.5" />
                  {showShiftHistory ? "Hide Shift Logs" : "View Shift Logs"}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Doctor Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="text"
                      className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-sans font-medium"
                      placeholder="e.g. Dr. Alex Carter"
                      value={docName}
                      onChange={(e) => setDocName(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Consulting Room</label>
                  <select
                    className="w-full p-2 border border-slate-200 rounded-xl text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-sans font-medium"
                    value={docRoom}
                    onChange={(e) => setDocRoom(e.target.value)}
                  >
                    {AVAILABLE_ROOMS.map(room => (
                      <option key={room} value={room}>{room}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Specialty Department</label>
                  <select
                    className="w-full p-2 border border-slate-200 rounded-xl text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-sans font-medium"
                    value={docDept}
                    onChange={(e) => setDocDept(e.target.value as Department)}
                  >
                    <option value="General Medicine">General Medicine</option>
                    <option value="Pediatrics">Pediatrics</option>
                    <option value="Cardiology">Cardiology</option>
                    <option value="Orthopedics">Orthopedics</option>
                    <option value="Emergency">Emergency</option>
                    <option value="Neurology">Neurology</option>
                    <option value="Oncology">Oncology</option>
                    <option value="Gynecology">Gynecology</option>
                    <option value="ENT">ENT</option>
                    <option value="Dermatology">Dermatology</option>
                    <option value="Ophthalmology">Ophthalmology</option>
                  </select>
                </div>

                <div className="flex justify-end pt-1">
                <button
                  type="button"
                  id="start-shift-btn"
                  onClick={handleStartShift}
                  disabled={!docName.trim()}
                  className={`flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wider py-2.5 px-5 rounded-xl transition-all shadow-sm ${
                    docName.trim()
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white hover:shadow-md cursor-pointer"
                      : "bg-slate-100 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  Start Duty Shift
                </button>
               </div>
            </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-800 font-sans tracking-tight">Active Workstation Session</h4>
                    <p className="text-[10px] text-slate-400 font-medium">Duty began at {new Date(activeShift.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowShiftHistory(!showShiftHistory)}
                    className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 hover:text-blue-600 uppercase tracking-wide transition-colors py-1 px-2.5 bg-slate-50 hover:bg-slate-100 rounded-lg"
                  >
                    <History className="w-3.5 h-3.5" />
                    {showShiftHistory ? "Hide Shift Logs" : "View Shift Logs"}
                  </button>

                  <button
                    type="button"
                    id="end-shift-btn"
                    onClick={handleEndShift}
                    className="flex items-center gap-1.5 text-xs font-bold text-rose-700 hover:text-white border border-rose-200 hover:bg-rose-600 py-1.5 px-3 rounded-xl transition-all cursor-pointer uppercase tracking-wider"
                  >
                    <Timer className="w-3.5 h-3.5" />
                    End Shift
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Clinician</span>
                    <span className="text-xs font-bold text-slate-800 truncate max-w-[140px] block">{activeShift.doctorName}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                    <Briefcase className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div>
                    <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Assigned Duty</span>
                    <span className="text-xs font-bold text-slate-800 block">{activeShift.room} • {activeShift.department}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                    <Timer className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Shift Duration</span>
                    <span className="text-xs font-mono font-bold text-emerald-700 block">{formatElapsed(elapsedSeconds)}</span>
                  </div>
                </div>
              </div>

              {/* Real-time statistics within the active shift */}
              <div className="flex items-center justify-between px-1 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-medium">Patients treated this shift:</span>
                  <span className="font-bold text-slate-800 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-lg text-[11px]">
                    {activeShift.patientsTreated.length} Patients
                  </span>
                </div>
                {activeShift.patientsTreated.length > 0 && (
                  <div className="text-[10px] text-slate-500 font-mono">
                    Tickets: {activeShift.patientsTreated.join(', ')}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Expandable shift logs history panel */}
          {showShiftHistory && (
            <div className="border-t border-slate-100 pt-4 space-y-4">
              <div className="flex items-center justify-between">
                <h5 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Duty Logs History & Daily Totals</h5>
                {shiftLogs.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearHistory}
                    className="flex items-center gap-1 text-[10px] text-rose-600 hover:underline uppercase tracking-wider font-semibold cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" /> Clear History
                  </button>
                )}
              </div>

              {/* Daily totals calculation */}
              {shiftLogs.length > 0 ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2.5 bg-blue-50/30 p-3 rounded-xl border border-blue-100/50 text-center">
                    <div>
                      <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Total Shifts</span>
                      <span className="text-sm font-black text-blue-700">{shiftLogs.length}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Active Time</span>
                      <span className="text-sm font-black text-blue-700">
                        {Math.floor(shiftLogs.reduce((acc, curr) => acc + curr.durationMinutes, 0) / 60)}h{" "}
                        {shiftLogs.reduce((acc, curr) => acc + curr.durationMinutes, 0) % 60}m
                      </span>
                    </div>
                    <div>
                      <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider font-sans">Patients Treated</span>
                      <span className="text-sm font-black text-blue-700">
                        {shiftLogs.reduce((acc, curr) => acc + curr.patientsTreated.length, 0)}
                      </span>
                    </div>
                  </div>

                  {/* List of past shifts */}
                  <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                    {shiftLogs.map((log) => (
                      <div key={log.id} className="p-3 border border-slate-100 rounded-xl hover:bg-slate-50 transition-all text-xs space-y-1.5">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-bold text-slate-800">{log.doctorName}</span>
                            <span className="text-slate-400 text-[10px] ml-1.5">({log.room} • {log.department})</span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-500 bg-slate-100 py-0.5 px-2 rounded-md font-semibold">
                            {log.durationMinutes} min shift
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-400">
                          <div className="flex items-center gap-1 font-medium">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            {new Date(log.startTime).toLocaleDateString([], { month: 'short', day: 'numeric' })} at{" "}
                            {new Date(log.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{" "}
                            {log.endTime ? new Date(log.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Ongoing"}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-500">Treated ({log.patientsTreated.length}): </span>
                            {log.patientsTreated.length > 0 ? (
                              <span className="font-mono bg-blue-50/50 text-blue-600 px-1 py-0.5 rounded text-[9px]">
                                {log.patientsTreated.join(', ')}
                              </span>
                            ) : (
                              <span className="italic text-slate-300">None</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400 text-center py-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 font-medium">No past shift logs found. Shifts will automatically record here after completion.</p>
              )}
            </div>
          )}
        </div>

        {/* Statistics Widgets */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm">
          <div className="p-3.5 bg-[#F8FAFC] rounded-2xl flex flex-col">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Waiting</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black text-blue-600">{waitingCount}</span>
              <span className="text-xs font-semibold text-slate-400">patients</span>
            </div>
          </div>
          <div className="p-3.5 bg-[#F8FAFC] rounded-2xl flex flex-col">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Called</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black text-blue-500">{calledCount}</span>
              <span className="text-xs font-semibold text-slate-400">in transit</span>
            </div>
          </div>
          <div className="p-3.5 bg-[#F8FAFC] rounded-2xl flex flex-col">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Active</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black text-indigo-600">{servingCount}</span>
              <span className="text-xs font-semibold text-slate-400">serving</span>
            </div>
          </div>
          <div className="p-3.5 bg-[#F8FAFC] rounded-2xl flex flex-col">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Served Today</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black text-emerald-600">{completedCount}</span>
              <span className="text-xs font-semibold text-slate-400">completed</span>
            </div>
          </div>
        </div>

        {/* Search, Filter & Seeder */}
        <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-1 items-center gap-3 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                placeholder="Search ticket, name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="relative">
              <select
                className="pl-3 pr-8 py-2 border border-slate-200 rounded-xl text-xs text-slate-600 focus:outline-none bg-white appearance-none"
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
              >
                <option value="All">All Specialties</option>
                <option value="General Medicine">General Medicine</option>
                <option value="Pediatrics">Pediatrics</option>
                <option value="Cardiology">Cardiology</option>
                <option value="Orthopedics">Orthopedics</option>
                <option value="Emergency">Emergency</option>
                <option value="Neurology">Neurology</option>
                <option value="Oncology">Oncology</option>
                <option value="Gynecology">Gynecology</option>
                <option value="ENT">ENT</option>
                <option value="Dermatology">Dermatology</option>
                <option value="Ophthalmology">Ophthalmology</option>
              </select>
              <Filter className="absolute right-3 top-3 w-3 h-3 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div className="flex items-center gap-3 self-end md:self-auto">
            <button
              id="toggle-doctor-audio-btn"
              type="button"
              onClick={toggleAudio}
              className={`flex items-center justify-center gap-1.5 text-xs border py-2 px-4 rounded-xl transition-all cursor-pointer font-bold uppercase tracking-wider ${
                audioEnabled
                  ? 'border-blue-200 bg-blue-50/80 text-blue-700 hover:bg-blue-100/70'
                  : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100'
              }`}
              title="Toggle audio chime when calling a patient"
            >
              {audioEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              Chime: {audioEnabled ? 'ON' : 'Muted'}
            </button>

            <button
              type="button"
              onClick={() => {
                preloadVoices();
                setTtsEnabled(prev => {
                  const next = !prev;
                  localStorage.setItem('doctor_tts_enabled', String(next));
                  if (!next) stopSpeech();
                  return next;
                });
              }}
              className={`flex items-center justify-center gap-1.5 text-xs border py-2 px-4 rounded-xl transition-all cursor-pointer font-bold uppercase tracking-wider ${
                ttsEnabled
                  ? 'border-emerald-200 bg-emerald-50/80 text-emerald-700 hover:bg-emerald-100/70'
                  : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100'
              }`}
              title="Toggle Amharic voice announcement when calling patients"
            >
              🗣️ Voice: {ttsEnabled ? 'ON' : 'OFF'}
            </button>

            {ttsEnabled && (
              <select
                className="py-2 px-2 border border-slate-200 rounded-xl text-[10px] font-bold text-slate-600 bg-white cursor-pointer"
                value={ttsLang}
                onChange={(e) => {
                  const lang = e.target.value as 'en' | 'am' | 'om';
                  setTtsLang(lang);
                  localStorage.setItem('doctor_tts_lang', lang);
                }}
              >
                <option value="am">🗣️ Amharic</option>
                <option value="om">🗣️ Afaan Oromoo</option>
                <option value="en">🗣️ English</option>
              </select>
            )}

            <button
              id="seed-reset-btn"
              type="button"
              onClick={onResetDatabase}
              className="flex items-center justify-center gap-1.5 text-xs text-slate-500 hover:text-blue-600 border border-slate-100 hover:border-blue-100 bg-slate-50 hover:bg-blue-50/50 py-2 px-4 rounded-xl transition-all cursor-pointer font-bold uppercase tracking-wider"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset Data
            </button>
          </div>
        </div>

        {/* Queue Status Tabs */}
        <div className="flex border-b border-slate-150">
          {(['Waiting', 'Called', 'Serving', 'Completed'] as PatientStatus[]).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setSelectedPatientId(null);
              }}
              className={`flex-1 text-center py-3 text-xs font-bold tracking-wider border-b-2 transition-all uppercase ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Patient Cards list */}
        <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
          {filteredPatients.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-[24px] border border-slate-50 text-slate-400">
              <Users className="w-12 h-12 mx-auto text-slate-200 mb-3" />
              <div className="text-sm font-bold text-slate-600 uppercase tracking-widest">No Patients Found</div>
              <p className="text-xs text-slate-400 mt-1">There are currently no patients in this category.</p>
            </div>
          ) : (
            filteredPatients.map((patient) => {
              const isSelected = selectedPatient && selectedPatient.id === patient.id;
              return (
                <div
                  key={patient.id}
                  onClick={() => setSelectedPatientId(patient.id)}
                  className={`p-5 rounded-[24px] border transition-all cursor-pointer bg-white flex items-center justify-between ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50/10 shadow-sm ring-1 ring-blue-500/20'
                      : 'border-slate-100 hover:border-slate-200 hover:bg-[#F8FAFC]'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {/* Urgency indicator bullet */}
                    <div className={`w-3 h-3 rounded-full shrink-0 ${
                      patient.triagePriority === 'Emergency' ? 'bg-rose-500 animate-pulse' :
                      patient.triagePriority === 'High' ? 'bg-amber-500' :
                      patient.triagePriority === 'Medium' ? 'bg-blue-500' : 'bg-slate-400'
                    }`} />

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-lg">
                          {patient.id}
                        </span>
                        <span className="text-sm font-bold text-slate-800">
                          {patient.name}
                        </span>
                        <span className="text-xs font-semibold text-slate-400">
                          ({patient.age}y / {patient.gender[0]})
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate max-w-sm mt-1.5 leading-relaxed font-medium">
                        {patient.symptoms}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <span className="block text-[10px] px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100 font-bold uppercase tracking-wider">
                        {patient.recommendedDepartment}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 mt-1.5 block">
                        {patient.status === 'Waiting' && `Est: ${patient.estimatedWaitMinutes}m`}
                        {patient.status === 'Called' && `Called to ${patient.assignedRoom}`}
                        {patient.status === 'Serving' && `Treating...`}
                        {patient.status === 'Completed' && `Treated`}
                      </span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-300" />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: Active Patient Detail Board & Actions (5 cols) */}
      <div className="lg:col-span-5 bg-white border border-slate-100 rounded-[24px] shadow-[0_15px_35px_rgba(0,0,0,0.02)] overflow-hidden sticky top-6">
        {selectedPatient ? (
          <div>
            {/* Header section with colors dependent on priority */}
            <div className={`p-6 text-white ${
              selectedPatient.triagePriority === 'Emergency' ? 'bg-rose-500' :
              selectedPatient.triagePriority === 'High' ? 'bg-amber-500' :
              selectedPatient.triagePriority === 'Medium' ? 'bg-blue-600' :
              'bg-slate-600'
            }`}>
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/20">
                    {selectedPatient.triagePriority} Triage Priority
                  </span>
                  <h3 className="text-2xl font-black font-sans mt-3 tracking-tight">{selectedPatient.name}</h3>
                </div>
                <div className="text-right">
                  <span className="font-mono text-base font-black bg-white/10 px-3 py-1.5 rounded-xl">
                    {selectedPatient.id}
                  </span>
                  <div className="text-[10px] text-white/80 font-bold mt-2">Score: {selectedPatient.triageScore}/5</div>
                </div>
              </div>

              <div className="flex items-center gap-5 mt-5 pt-4 border-t border-white/10 text-xs font-semibold text-white/90">
                <div>Age: <span className="font-bold">{selectedPatient.age}</span></div>
                <div>Gender: <span className="font-bold">{selectedPatient.gender}</span></div>
                <div>Check-in: <span className="font-bold">
                  {new Date(selectedPatient.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span></div>
              </div>
            </div>

            {/* Content section */}
            <div className="p-6 space-y-5 text-xs">
              {/* Symptoms entered by patient */}
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Stated Symptoms</span>
                <p className="bg-slate-50 p-4 rounded-2xl text-slate-700 leading-relaxed italic border border-slate-100 font-sans font-medium text-xs">
                  "{selectedPatient.symptoms}"
                </p>
              </div>

              {/* Clinical Insights */}
              <div className="border border-blue-100 bg-blue-50/10 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-1.5 text-blue-800 font-bold border-b border-blue-100/60 pb-2">
                  <Stethoscope className="w-4 h-4 text-blue-600" />
                  <span className="uppercase tracking-wider text-[10px]">Clinical Triage Analysis</span>
                </div>

                {selectedPatient.aiAnalysis ? (
                  <div className="space-y-3.5 leading-relaxed text-slate-600 font-medium">
                    <div>
                      <strong className="text-slate-800 block text-[9px] font-bold uppercase tracking-widest mb-1">Clinical Priority Justification</strong>
                      <p>{selectedPatient.aiAnalysis.priorityExplanation}</p>
                    </div>
                    <div>
                      <strong className="text-slate-800 block text-[9px] font-bold uppercase tracking-widest mb-1">Intake Precautions & Advice</strong>
                      <p className="text-rose-700 font-bold">{selectedPatient.aiAnalysis.clinicalPrecaution}</p>
                    </div>
                    <div>
                      <strong className="text-slate-800 block text-[9px] font-bold uppercase tracking-widest mb-1.5">Recommended Vitals to Assess</strong>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {selectedPatient.aiAnalysis.suggestedVitalsToMeasure.map((vital, index) => (
                          <span key={index} className="px-2.5 py-1 rounded bg-blue-100/40 text-blue-800 text-[10px] font-bold border border-blue-200/40">
                            {vital}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-400 italic">No clinical analysis details found for this patient.</p>
                )}
              </div>

              {/* Patient Flow Controls */}
              <div className="border-t border-slate-100 pt-5 space-y-4">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Queue Flow Controls</span>

                {selectedPatient.status === 'Waiting' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1.5">Assign Consultation Room / Location:</label>
                      <select
                        className="w-full p-2.5 border border-slate-200 rounded-xl bg-white text-xs text-slate-700"
                        value={selectedRoom}
                        onChange={(e) => setSelectedRoom(e.target.value)}
                      >
                        {AVAILABLE_ROOMS.map(r => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </div>
                    <button
                      id="call-patient-btn"
                      type="button"
                      disabled={loadingAction}
                      onClick={() => handleCallPatient(selectedPatient.id)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md hover:shadow-lg hover:shadow-blue-200"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      Call Patient to {selectedRoom}
                    </button>
                  </div>
                )}

                {selectedPatient.status === 'Called' && (
                  <div className="flex gap-3">
                    <button
                      id="serve-patient-btn"
                      type="button"
                      disabled={loadingAction}
                      onClick={() => handleServePatient(selectedPatient.id)}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md hover:shadow-lg hover:shadow-indigo-200"
                    >
                      <Stethoscope className="w-3.5 h-3.5" />
                      Start Treatment
                    </button>
                    <button
                      id="noshow-patient-btn"
                      type="button"
                      disabled={loadingAction}
                      onClick={() => handleNoShowPatient(selectedPatient.id)}
                      className="border border-rose-200 hover:bg-rose-50 text-rose-700 font-bold py-3 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Ban className="w-3.5 h-3.5" />
                      Mark No-Show
                    </button>
                  </div>
                )}

                {selectedPatient.status === 'Serving' && (
                  <button
                    id="complete-patient-btn"
                    type="button"
                    disabled={loadingAction}
                    onClick={() => handleCompletePatient(selectedPatient.id)}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Complete and Discharge Patient
                  </button>
                )}

                {selectedPatient.status === 'Completed' && (
                  <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 flex items-center gap-2 font-semibold">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>Discharged at {new Date(selectedPatient.completedTime || "").toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                )}
              </div>

              {/* Triage Override Panel */}
              <div className="border-t border-slate-100 pt-4">
                {showOverridePanel ? (
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 space-y-3.5">
                    <div className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">Manual Triage Adjustment</div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wide">Specialty Department</label>
                        <select
                          className="w-full p-2 border border-slate-200 rounded-lg bg-white text-xs text-slate-700"
                          value={manualDepartment}
                          onChange={(e) => setManualDepartment(e.target.value as Department)}
                        >
                          <option value="General Medicine">General Medicine</option>
                          <option value="Pediatrics">Pediatrics</option>
                          <option value="Cardiology">Cardiology</option>
                          <option value="Orthopedics">Orthopedics</option>
                          <option value="Emergency">Emergency</option>
                          <option value="Neurology">Neurology</option>
                          <option value="Oncology">Oncology</option>
                          <option value="Gynecology">Gynecology</option>
                          <option value="ENT">ENT</option>
                          <option value="Dermatology">Dermatology</option>
                          <option value="Ophthalmology">Ophthalmology</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wide">Clinical Priority</label>
                        <select
                          className="w-full p-2 border border-slate-200 rounded-lg bg-white text-xs text-slate-700"
                          value={manualPriority}
                          onChange={(e) => setManualPriority(e.target.value as Priority)}
                        >
                          <option value="Low">Low</option>
                          <option value="Medium">Medium</option>
                          <option value="High">High</option>
                          <option value="Emergency">Emergency</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => setShowOverridePanel(false)}
                        className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-600 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOverrideTriage(selectedPatient.id)}
                        className="px-4 py-1.5 text-xs font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
                      >
                        Save Adjustments
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setManualPriority(selectedPatient.triagePriority);
                      setManualDepartment(selectedPatient.recommendedDepartment);
                      setShowOverridePanel(true);
                    }}
                    className="text-xs text-slate-400 hover:text-blue-600 font-bold uppercase tracking-wider flex items-center gap-1.5 mt-1 cursor-pointer transition-colors"
                  >
                    <Sliders className="w-3.5 h-3.5" /> Adjust Priority / Department Routing
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-16 text-center text-slate-400">
            <Info className="w-10 h-10 mx-auto text-slate-200 mb-3" />
            <div className="text-sm font-bold text-slate-500 uppercase tracking-widest">No Selection</div>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">Select a patient card to view medical information, symptoms, and clinical advice summaries.</p>
          </div>
        )}
      </div>
    </div>
  );
}
