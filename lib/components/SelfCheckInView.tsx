'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, CalendarCheck, Heart, ArrowRight, CheckCircle, RefreshCw, 
  Printer, ShieldAlert, Search, ChevronRight, Flame, Clock
} from 'lucide-react';
import { Patient } from '@/lib/types';
import QRCode from 'qrcode';
import { Language, t } from '@/lib/utils/translations';

interface SelfCheckInViewProps {
  onCheckInSuccess: (patient: Patient) => void;
  patients?: Patient[];
  language?: Language;
}

export default function SelfCheckInView({ onCheckInSuccess, language = 'en' }: SelfCheckInViewProps) {
  const [step, setStep] = useState<'service' | 'identity' | 'done'>('service');
  const [selectedService, setSelectedService] = useState<'new' | 'existing' | 'appointment' | null>(null);
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdPatient, setCreatedPatient] = useState<Patient | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);

  const resetForm = () => {
    setName("");
    setAge("");
    setGender("");
    setCreatedPatient(null);
    setQrCodeUrl(null);
    setStep('service');
    setError(null);
    setSelectedService(null);
  };

  const handleSubmit = async () => {
    if (!name.trim()) return setError("Please enter your name");
    if (!age || Number(age) <= 0) return setError("Please enter a valid age");
    if (!gender) return setError("Please select your gender");

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/patients/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name, 
          age: Number(age), 
          gender, 
          symptoms: selectedService === 'appointment' ? 'Scheduled outpatient specialist appointment' : 'Self-Check-In patient registration',
          service: selectedService === 'appointment' ? 'Appointment' : 'New Patient'
        })
      });

      if (!response.ok) throw new Error('Check-in failed on the server.');

      const data: Patient = await response.json();
      setCreatedPatient(data);

      try {
        const trackerUrl = `${window.location.origin}/track/${data.id}`;
        const qrDataUrl = await QRCode.toDataURL(trackerUrl, {
          width: 300, margin: 1.5,
          color: { dark: '#1e3a8a', light: '#ffffff' }
        });
        setQrCodeUrl(qrDataUrl);
      } catch { setQrCodeUrl(null); }

      onCheckInSuccess(data);
      setStep('done');
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-slate-100 overflow-hidden">
      <div className="bg-emerald-600 p-8 text-white text-center relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
        <div className="flex justify-center items-center gap-3.5 mb-2 relative z-10">
          <Heart className="w-8 h-8 text-emerald-100 animate-pulse" />
          <h2 className="text-2xl font-extrabold font-sans tracking-tight">{t('selfCheckInKioskHeader', language)}</h2>
        </div>
        <p className="text-emerald-50 text-xs font-semibold uppercase tracking-widest relative z-10">{t('fastTrackText', language)}</p>
      </div>

      <div className="p-8">
        <AnimatePresence mode="wait">
          {step === 'service' && selectedService === null && (
            <motion.div key="service" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-6">
              <div className="text-center space-y-2 py-2">
                <h3 className="text-xl font-extrabold text-slate-800 font-sans tracking-tight">{t('whatBringsYouIn', language)}</h3>
                <p className="text-xs text-slate-500 font-medium">{language === 'am' ? 'እባክዎ ለመጀመር የአገልግሎት አይነት ይምረጡ' : language === 'om' ? 'Maaloo tajaajila jalqabuuf tokko filadhaa' : 'Please choose a service to begin your check-in'}</p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <button type="button" onClick={() => setSelectedService('new')}
                  className="p-5 border-2 border-slate-100 hover:border-emerald-500 hover:bg-emerald-50/20 rounded-2xl transition-all duration-200 text-left cursor-pointer flex items-center justify-between group">
                  <div className="space-y-1">
                    <div className="font-extrabold text-slate-800 text-base group-hover:text-emerald-800 flex items-center gap-2 font-sans">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                      {language === 'am' ? 'አዲስ ታካሚ' : language === 'om' ? 'Dhukkubsataa Haaraa' : 'New Patient Registration'}
                    </div>
                    <p className="text-xs text-slate-500">{language === 'am' ? 'የመጀመሪያ ግቤት ለማድረግ ስም እና መረጃ ያስገቡ' : language === 'om' ? 'Seenuuf maqaa fi odeeffannoo galchaa' : 'Register your details to get a queue ticket'}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                </button>

                <button type="button" onClick={() => setSelectedService('appointment')}
                  className="p-5 border-2 border-slate-100 hover:border-emerald-500 hover:bg-emerald-50/20 rounded-2xl transition-all duration-200 text-left cursor-pointer flex items-center justify-between group">
                  <div className="space-y-1">
                    <div className="font-extrabold text-slate-800 text-base group-hover:text-emerald-800 flex items-center gap-2 font-sans">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                      {t('reason_appointment_title', language)}
                    </div>
                    <p className="text-xs text-slate-500">{t('reason_appointment_desc', language)}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 'service' && selectedService !== null && (
            <motion.div key="identity" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">1</span>
                  <h3 className="text-lg font-semibold text-slate-800 font-sans">{t('identifyYourself', language)}</h3>
                </div>
                <button type="button" onClick={() => { setSelectedService(null); setName(""); setAge(""); setGender(""); }}
                  className="text-xs text-slate-500 hover:text-slate-800 font-bold uppercase tracking-wider bg-slate-100 py-1 px-2.5 rounded-lg transition-colors cursor-pointer">
                  {language === 'am' ? 'አገልግሎት ቀይር' : language === 'om' ? 'Tajaajila Haaromsuu' : 'Change Service'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1.5">{t('fullName', language)}</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input type="text" className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm"
                      placeholder={language === 'am' ? 'ለምሳሌ፦ አቶ ዳንኤል ግርማ' : language === 'om' ? 'Fk. Ato Daniel Girma' : 'e.g. Ato Daniel Girma'}
                      value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1.5">{t('age', language)}</label>
                    <input type="number" className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm"
                      placeholder="Years" min="0" max="125" value={age} onChange={(e) => setAge(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1.5">{t('gender', language)}</label>
                    <select className="w-full px-2 py-2.5 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm"
                      value={gender} onChange={(e) => setGender(e.target.value)}>
                      <option value="">{t('select', language)}</option>
                      <option value="Male">{t('male', language)}</option>
                      <option value="Female">{t('female', language)}</option>
                      <option value="Other">{t('other', language)}</option>
                    </select>
                  </div>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3.5 bg-rose-50 border border-rose-100 text-rose-700 rounded-lg text-sm">
                  <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button type="button" disabled={loading} onClick={handleSubmit}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-md hover:shadow-lg hover:shadow-emerald-200 disabled:bg-emerald-400 disabled:cursor-not-allowed text-xs uppercase tracking-wider cursor-pointer">
                {loading ? (
                  <><RefreshCw className="w-4 h-4 animate-spin" /> {language === 'am' ? 'እየተመዘገበ ነው...' : language === 'om' ? 'Galmeessaa jira...' : 'Processing...'}</>
                ) : (
                  <><CheckCircle className="w-4 h-4" /> {t('checkInNow', language)}</>
                )}
              </button>
            </motion.div>
          )}

          {step === 'done' && createdPatient && (
            <motion.div key="done" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center space-y-6 py-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-1">
                <CheckCircle className="w-10 h-10" />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold text-slate-800">{t('registrationSuccessful', language)}</h3>
                <p className="text-sm text-slate-500 mt-1">
                  {language === 'am' ? 'የእርስዎ ምዝገባ ተጠናቋል። እባክዎ ከታች ያለውን ትኬት ይውሰዱ።' : language === 'om' ? 'Galmeessi kee xumurameera. Tikkee kee fudhadhu.' : 'Your arrival has been logged. Please take your printed ticket below.'}
                </p>
              </div>

              <motion.div initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', damping: 15, delay: 0.2 }}
                className="w-72 bg-gradient-to-b from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-5 shadow-lg border-t-8 border-t-emerald-600 font-sans text-slate-800 relative overflow-hidden">
                <div className="absolute top-1/2 -left-3 w-6 h-6 rounded-full bg-white border-r border-emerald-200"></div>
                <div className="absolute top-1/2 -right-3 w-6 h-6 rounded-full bg-white border-l border-emerald-200"></div>
                <div className="text-center pb-3 border-b border-emerald-200/50">
                  <span className="text-[10px] tracking-wider uppercase font-semibold text-emerald-800">{t('hospitalName', language)}</span>
                  <div className="text-4xl font-extrabold tracking-tight text-slate-900 mt-1">{createdPatient.id}</div>
                  <div className="text-xs text-slate-500 mt-1">{t('patient', language)}: <span className="font-semibold text-slate-700">{createdPatient.name}</span></div>
                </div>
                <div className="py-4 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">{t('department', language)}:</span>
                    <span className="font-semibold text-slate-700">{createdPatient.recommendedDepartment}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">{language === 'am' ? 'የተመረጠ አገልግሎት' : language === 'om' ? 'Tajaajila Filatame' : 'Service Type'}:</span>
                    <span className="font-semibold text-slate-700">{selectedService === 'appointment' ? t('reason_appointment_title', language) : 'New Patient'}</span>
                  </div>
                  <div className="flex justify-between border-t border-dashed border-emerald-200 pt-2 mt-2">
                    <span className="text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3" /> {t('estimatedWait', language)}:</span>
                    <span className="font-bold text-slate-800 text-sm">{createdPatient.estimatedWaitMinutes} {t('mins', language)}</span>
                  </div>
                </div>
                {qrCodeUrl && (
                  <div className="flex flex-col items-center justify-center p-3.5 bg-white rounded-xl border border-emerald-200/50 shadow-inner my-3">
                    <img src={qrCodeUrl} alt="QR Code" className="w-28 h-28 mix-blend-multiply" referrerPolicy="no-referrer" />
                    <span className="text-[9px] font-black text-emerald-700 uppercase tracking-widest mt-1.5 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                      {language === 'am' ? 'ለመከታተል በስልክ ይቃኙ' : language === 'om' ? 'Bilbilaan hordofuuf Iskaan godhaa' : 'Scan to Track on Phone'}
                    </span>
                  </div>
                )}
                <div className="pt-2 border-t border-emerald-200/50 text-center text-[10px] text-slate-400 space-y-1">
                  <div>Check-in: {new Date(createdPatient.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  <div className="flex items-center justify-center gap-1 text-emerald-600 font-medium">
                    <Printer className="w-3 h-3" /> {language === 'am' ? 'ቲኬት በትክክል ታትሟል' : language === 'om' ? 'Tikkeen Maxxanfameera' : 'Ticket Printed Successfully'}
                  </div>
                </div>
              </motion.div>

              <div className="bg-slate-50 p-4 rounded-xl max-w-md border border-slate-100 space-y-1 text-xs text-slate-600 text-center">
                <div className="font-bold text-emerald-800 uppercase tracking-wider mb-1">
                  {language === 'am' ? 'እንኳን ወደ ላንሴት በሰላም መጡ' : language === 'om' ? 'Baga Gara Lancet Nagaan Dhuftan' : 'Welcome to Lancet General'}
                </div>
                <p className="leading-relaxed">
                  {language === 'am' ? 'ምዝገባዎ ተጠናቋል። እባክዎ በመጠባበቂያ ክፍሉ ውስጥ ይቀመጡ። በቅርቡ በቲኬት ቁጥርዎ እንጠራዎታለን።' : language === 'om' ? 'Haalli kee sirreeffameera. Maaloo boqonnaa lobby keessa taa\'aa. Lakkoofsa tikkee keessaniin isin waamna.' : 'Your details match our scheduling system. Please have a seat in the lobby. We will call your ticket number shortly.'}
                </p>
              </div>

              <button type="button" onClick={resetForm}
                className="w-full max-w-xs border border-emerald-600 hover:bg-emerald-50 text-emerald-700 font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm uppercase tracking-wider cursor-pointer">
                {t('checkInAnotherPatient', language)} <RefreshCw className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
