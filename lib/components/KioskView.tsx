'use client';
import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, Clock, AlertTriangle, Users, 
  Stethoscope, 
  Activity, RefreshCw, CheckCircle, ArrowRight, AlertCircle
} from 'lucide-react';
import { Patient } from '@/lib/types';
import { Language, t } from '@/lib/utils/translations';

interface KioskViewProps {
  onCheckInSuccess?: (patient: Patient) => void;
  patients?: Patient[];
  language?: Language;
}

const PRESET_SYMPTOMS = [
  { id: "chest", dept: "Cardiology", label: "Chest tightness / Cardiac pain", desc: "Shortness of breath, pressure, palpitations" },
  { id: "pediatric", dept: "Pediatrics", label: "Pediatric high fever", desc: "Child under 14 with high temperature, cough" },
  { id: "ortho", dept: "Orthopedics", label: "Severe sprain / Bone fracture", desc: "Twisted limb, joint swelling, unable to bear weight" },
  { id: "breathing", dept: "Emergency", label: "Acute breathing difficulty", desc: "Sudden respiratory distress, severe allergies" },
  { id: "cold", dept: "General Medicine", label: "Sore throat / Standard cold", desc: "Mild fever, runny nose, congestion" },
];

export default function KioskView({ patients = [], language = 'en' }: KioskViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [symptoms, setSymptoms] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [triagedPatient, setTriagedPatient] = useState<Patient | null>(null);

  const checkedInPatients = useMemo(() => {
    const priorityOrder: Record<string, number> = { Emergency: 4, High: 3, Medium: 2, Low: 1 };
    return patients
      .filter(p => p.status === 'Waiting')
      .filter(p => {
        if (filterPriority !== 'all' && p.triagePriority !== filterPriority) return false;
        if (searchTerm) {
          const s = searchTerm.toLowerCase();
          return p.name.toLowerCase().includes(s) || p.id.toLowerCase().includes(s);
        }
        return true;
      })
      .sort((a, b) => {
        const pA = priorityOrder[a.triagePriority] || 0;
        const pB = priorityOrder[b.triagePriority] || 0;
        if (pB !== pA) return pB - pA;
        return new Date(a.checkInTime).getTime() - new Date(b.checkInTime).getTime();
      });
  }, [patients, filterPriority, searchTerm]);

  const selectPreset = useCallback((preset: typeof PRESET_SYMPTOMS[0]) => {
    setSymptoms(prev => prev ? prev + "\n" + preset.label + ": " + preset.desc : preset.label + ": " + preset.desc);
  }, []);

  const handleTriageSubmit = useCallback(async () => {
    if (!selectedPatient) return;
    if (!symptoms.trim()) return setError(language === 'am' ? 'እባክዎ የህመም ምልክቶችን ይግለጹ' : language === 'om' ? 'Mallattoolee barreessaa' : 'Please describe the symptoms');

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/patients/triage-existing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedPatient.id, symptoms })
      });

      if (!response.ok) throw new Error('Triage update failed.');

      const data: Patient = await response.json();
      setTriagedPatient(data);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }, [selectedPatient, symptoms, language]);

  const resetTriage = useCallback(() => {
    setSelectedPatient(null);
    setSymptoms("");
    setError(null);
    setTriagedPatient(null);
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-blue-600 rounded-3xl p-6 text-white relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
        <div className="flex items-center justify-between relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Stethoscope className="w-6 h-6 text-blue-100" />
              <h2 className="text-xl font-extrabold font-sans tracking-tight">
                {language === 'am' ? 'የቲሪያዥ ተቋም' : language === 'om' ? 'Oncaa Triage' : 'Clinical Triage'}
              </h2>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {triagedPatient ? (
          <motion.div key="triage-done" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }}
            className="bg-white rounded-3xl border border-emerald-200 shadow-sm p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">
              {language === 'am' ? 'ቲሪያዥ ተጠናቋል' : language === 'om' ? 'Triage Xumurameera' : 'Triage Completed'}
            </h3>
            <div className="max-w-sm mx-auto space-y-2 text-sm">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">{t('patient', language)}:</span>
                <span className="font-bold text-slate-800">{triagedPatient.name} ({triagedPatient.id})</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">{t('department', language)}:</span>
                <span className="font-bold text-slate-800">{triagedPatient.recommendedDepartment}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">{language === 'am' ? 'ቅድሚያ' : language === 'om' ? 'Dursa' : 'Priority'}:</span>
                <span className={`font-bold uppercase ${
                  triagedPatient.triagePriority === 'Emergency' ? 'text-rose-600' :
                  triagedPatient.triagePriority === 'High' ? 'text-amber-600' :
                  triagedPatient.triagePriority === 'Medium' ? 'text-blue-600' : 'text-slate-500'
                }`}>{triagedPatient.triagePriority}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">{language === 'am' ? 'የምርመራ ውጤት' : language === 'om' ? "Bu'aa Qorannoo" : 'Triage Score'}:</span>
                <span className="font-bold text-slate-800">{triagedPatient.triageScore}/10</span>
              </div>
            </div>
            <button type="button" onClick={resetTriage}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-xl transition-colors text-xs uppercase tracking-wider cursor-pointer inline-flex items-center gap-2">
              {language === 'am' ? 'ተጨማሪ ታካሚ ተመልስ' : language === 'om' ? 'Dhukkubsataa Biroo' : 'Back to Patient List'} <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        ) : selectedPatient ? (
          <motion.div key="symptoms-form" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="bg-blue-50 border-b border-blue-100 p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">{selectedPatient.id}</div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-800">{selectedPatient.name}</h3>
                    <p className="text-[10px] text-slate-500 font-medium">{selectedPatient.age} • {selectedPatient.gender} • {selectedPatient.recommendedDepartment}</p>
                  </div>
                </div>
                <button type="button" onClick={resetTriage}
                  className="text-xs text-slate-500 hover:text-slate-800 font-bold uppercase tracking-wider bg-white border border-slate-200 py-1.5 px-3 rounded-lg transition-colors cursor-pointer">
                  {language === 'am' ? 'ተመለስ' : language === 'om' ? "Deebi'i" : 'Back'}
                </button>
              </div>

              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    {language === 'am' ? 'የህመም ምልክቶችን ይግለጹ' : language === 'om' ? 'Mallattoolee Ibsi' : 'Describe Symptoms & Feeling'}
                  </label>
                  <textarea
                    className="w-full p-3.5 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-sans text-sm"
                    rows={4}
                    placeholder={language === 'am' ? 'ለምሳሌ፦ የ⟿ስት ህመም አለኛ ሁኔታ...' : language === 'om' ? 'Fk. Dhaanii kee ibsi...' : 'e.g., I have a burning chest pain that radiates to my left arm, along with mild nausea...'}
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                  />
                </div>

                <div>
                  <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    {language === 'am' ? 'ፈጣን የህመም ቅድመ ምርጫዎች' : language === 'om' ? 'Filannoo Mallattoolee' : 'Quick Symptom Presets'}
                  </span>
                  <div className="grid grid-cols-1 gap-2">
                    {PRESET_SYMPTOMS.map((preset, idx) => {
                      const presetLabel = t(`preset_symptom_${preset.id}`, language);
                      const presetDesc = t(`preset_symptom_${preset.id}_desc`, language);
                      return (
                        <button key={idx} type="button" onClick={() => selectPreset(preset)}
                          className="text-left px-3.5 py-2.5 border border-slate-100 hover:border-blue-100 hover:bg-blue-50/30 rounded-xl transition-all duration-200 group flex items-start justify-between cursor-pointer">
                          <div>
                            <div className="text-xs font-semibold text-slate-700 group-hover:text-blue-800">{presetLabel}</div>
                            <div className="text-[11px] text-slate-400 mt-0.5">{presetDesc}</div>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-700 font-bold uppercase tracking-wider">
                            {preset.dept}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3.5 bg-rose-50 border border-rose-100 text-rose-700 rounded-lg text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button type="button" disabled={loading || !symptoms.trim()} onClick={handleTriageSubmit}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-md hover:shadow-lg hover:shadow-blue-200 disabled:bg-blue-300 disabled:cursor-not-allowed text-xs uppercase tracking-wider cursor-pointer">
                  {loading ? (
                    <><RefreshCw className="w-4 h-4 animate-spin" /> {language === 'am' ? 'እየተመዘገበ ነው...' : language === 'om' ? 'Galmeessaa jira...' : 'Processing...'}</>
                  ) : (
                    <><Activity className="w-4 h-4" /> {language === 'am' ? 'ቲሪያዥ አsteder ቀይር' : language === 'om' ? 'Triage Harjedhu' : 'Submit Triage'}</>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div key="patient-list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text"
                  placeholder={language === 'am' ? 'በስም ወይም በቲኬት ቁጥር ፈትሽ...' : language === 'om' ? 'Maqaa ykn lakkoofsa tikkee isa barreessi...' : 'Search by name or ticket ID...'}
                  value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
              </div>
              <div className="flex bg-white border border-slate-200 rounded-xl overflow-hidden">
                {['all', 'Emergency', 'High', 'Medium', 'Low'].map((p) => (
                  <button key={p} type="button" onClick={() => setFilterPriority(p)}
                    className={`px-3 py-2 text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                      filterPriority === p
                        ? p === 'Emergency' ? 'bg-rose-600 text-white'
                          : p === 'High' ? 'bg-amber-500 text-white'
                          : p === 'Medium' ? 'bg-blue-600 text-white'
                          : p === 'Low' ? 'bg-emerald-600 text-white'
                          : 'bg-slate-800 text-white'
                        : 'text-slate-500 hover:bg-slate-50'
                    }`}>
                    {p === 'all' ? (language === 'am' ? 'ሁሉም' : language === 'om' ? 'Hunduu' : 'All') : p}
                  </button>
                ))}
              </div>
            </div>

            {checkedInPatients.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-slate-300" />
                </div>
                <h3 className="text-base font-bold text-slate-700 mb-1">
                  {language === 'am' ? 'ታካሚ የለም' : language === 'om' ? 'Dhukkubsataa hin jiru' : 'No Patients'}
                </h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  {language === 'am' ? 'አዲስ ታካሚ ሲመዝገብ እዚህ ይዘረዛራል።' : language === 'om' ? 'Dhukkubsattonni haaraa galmeeffaman asitti mul\'atu.' : 'Patients will appear here after checking in.'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {checkedInPatients.map((patient, idx) => {
                  const pc = patient.triagePriority === 'Emergency' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                             patient.triagePriority === 'High' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                             patient.triagePriority === 'Medium' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                             'bg-emerald-50 text-emerald-700 border-emerald-200';
                  const waitMin = Math.floor((Date.now() - new Date(patient.checkInTime).getTime()) / 60000);

                  return (
                    <motion.div key={patient.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}
                      className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:border-blue-200 transition-all">
                      <button type="button" onClick={() => setSelectedPatient(patient)}
                        className="w-full p-4 flex items-center justify-between gap-4 text-left cursor-pointer hover:bg-slate-50/50 transition-colors">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className="flex-shrink-0">
                            <span className={`inline-flex items-center justify-center w-10 h-10 rounded-xl text-xs font-black ${pc}`}>
                              {idx + 1}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-extrabold text-slate-800">{patient.name}</span>
                              <span className="text-[10px] font-mono font-black text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md">{patient.id}</span>
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500 font-medium">
                              <span>{patient.age} • {patient.gender === 'Male' ? t('male', language) : patient.gender === 'Female' ? t('female', language) : t('other', language)}</span>
                              <span className="text-slate-300">|</span>
                              <span className="flex items-center gap-1"><Stethoscope className="w-3 h-3" />{patient.recommendedDepartment}</span>
                              <span className="text-slate-300">|</span>
                              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{waitMin}m</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                            patient.triagePriority === 'Emergency' ? 'bg-rose-100 text-rose-700' :
                            patient.triagePriority === 'High' ? 'bg-amber-100 text-amber-700' :
                            patient.triagePriority === 'Medium' ? 'bg-blue-100 text-blue-700' :
                            'bg-emerald-100 text-emerald-700'
                          }`}>
                            {patient.triagePriority === 'Emergency' && <AlertTriangle className="w-3 h-3 inline mr-0.5" />}
                            {patient.triagePriority}
                          </span>
                          <ArrowRight className="w-4 h-4 text-slate-300" />
                        </div>
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
