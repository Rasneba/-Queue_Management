'use client';
import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Volume2, VolumeX, Bell, Tv, MapPin, Sparkles, CheckCircle2, ChevronRight, AlertCircle, Clock } from 'lucide-react';
import { Patient } from '@/lib/types';
import { Language } from '@/lib/utils/translations';
import { speakText, speakTicket, stopSpeech } from '@/lib/utils/tts';
import { playPleasantChime } from '@/lib/utils/audio';

interface WaitingBoardProps {
  patients: Patient[];
  language?: Language;
  isOffline?: boolean;
  onCallNext?: () => void;
}

function LiveClock({ language }: { language: Language }) {
  const [time, setTime] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  return (
    <div className="text-right">
      <div className="text-base font-extrabold text-slate-800 tabular-nums">
        {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </div>
      <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
        {time.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
      </div>
    </div>
  );
}

function parseTicketNumber(id: string): number {
  const match = id.match(/P-(\d+)/);
  return match ? parseInt(match[1], 10) : 999999;
}

export default function WaitingBoard({ patients, language = 'en', isOffline = false, onCallNext }: WaitingBoardProps) {
  const [audioEnabled, setAudioEnabled] = useState(true);
  const lastCalledIdRef = useRef<string | null>(null);
  const autoSpokenRef = useRef<string | null>(null);

  const servingPatients = useMemo(
    () => patients.filter(p => p.status === 'Called' || p.status === 'Serving'),
    [patients]
  );

  const nextPatients = useMemo(() => {
    return patients
      .filter(p => p.status === 'Waiting')
      .sort((a, b) => parseTicketNumber(a.id) - parseTicketNumber(b.id))
      .slice(0, 10);
  }, [patients]);

  const totalWaiting = patients.filter(p => p.status === 'Waiting').length;
  const totalCalled = patients.filter(p => p.status === 'Called').length;
  const totalServing = patients.filter(p => p.status === 'Serving').length;

  useEffect(() => {
    const recentlyCalled = patients.find(p => {
      if (p.status !== 'Called' || !p.calledTime) return false;
      const diffMs = Date.now() - new Date(p.calledTime).getTime();
      return diffMs < 12000;
    });

    if (recentlyCalled && recentlyCalled.id !== lastCalledIdRef.current) {
      lastCalledIdRef.current = recentlyCalled.id;
      if (audioEnabled) {
        triggerVoiceCall(recentlyCalled);
      }
    }
  }, [patients, audioEnabled]);

  useEffect(() => {
    if (!audioEnabled || nextPatients.length === 0) return;
    const next = nextPatients[0];
    if (autoSpokenRef.current === next.id) return;

    autoSpokenRef.current = next.id;
    playPleasantChime();

    setTimeout(() => {
      speakTicket(next.id, 'reception');
    }, 1200);
  }, [nextPatients, audioEnabled]);

  const triggerVoiceCall = async (patient: Patient) => {
    playPleasantChime();
    setTimeout(() => {
      speakTicket(patient.id, patient.assignedRoom || 'reception');
    }, 1200);
  };

  const maskName = (fullName: string) => {
    const parts = fullName.trim().split(" ");
    if (parts.length === 1) return parts[0];
    return `${parts[0]} ${parts[parts.length - 1][0]}.`;
  };

  return (
    <div id="waiting-board" className="bg-white rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-slate-100 overflow-hidden font-sans">
      {isOffline && (
        <div className="bg-rose-50 border-b border-rose-100 px-8 py-3.5 flex items-center justify-between gap-4 text-rose-800 text-xs font-semibold animate-pulse">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
            <span>
              <strong>{language === 'am' ? 'ከመስመር ውጭ፦' : language === 'om' ? 'Offline:' : 'Offline Mode:'}</strong>{' '}
              {language === 'am' ? 'የአገልጋይ ግንኙነት ተቋርጧል።' : language === 'om' ? 'Gergariin citeera.' : 'Live connection to the server has been lost.'}
            </span>
          </div>
          <span className="px-2.5 py-0.5 rounded bg-rose-200/60 text-rose-900 text-[10px] font-black uppercase tracking-wider">
            {language === 'am' ? 'ግንኙነት የለም' : language === 'om' ? 'No Connection' : 'No Connection'}
          </span>
        </div>
      )}

      <div className="bg-white border-b border-slate-100 px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-sm">
            <Tv className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              {language === 'am' ? 'የላንሰት የመደበኛ ሆስፒታል' : language === 'om' ? 'Hospitaal General Lancet' : 'Lancet General Hospital'}{' '}
              {isOffline ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 border border-rose-200 text-rose-600 text-[9px] font-black uppercase tracking-widest animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Offline
                </span>
              ) : (
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              )}
            </h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              {language === 'am' ? 'የቀጥታ ወረፋ መከታተያ ሰሌዳ' : language === 'om' ? 'Moniitara Tarree Yeroo Dhugaa' : 'Live Queue Monitor Board'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 text-right">
          <button
            type="button"
            onClick={() => {
              setAudioEnabled(!audioEnabled);
              if (!audioEnabled) {
                speakText(language === 'am' ? "የድምፅ ማስታወቂያ በርቷል" : language === 'om' ? "Sagaleen hojjachaa jira" : "Voice alerts enabled", language as 'am' | 'en' | 'om');
                autoSpokenRef.current = null;
              } else {
                stopSpeech();
              }
            }}
            className={`flex items-center gap-1.5 text-xs py-1.5 px-3 rounded-lg border transition-all ${
              audioEnabled ? 'bg-blue-50 border-blue-200 text-blue-600 font-bold' : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-800'
            }`}
          >
            {audioEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span className="font-bold text-[10px] uppercase tracking-wider">
              {audioEnabled ? (language === 'am' ? 'ድምፅ በርቷል' : language === 'om' ? 'Sagalee ON' : 'Voice ON') : (language === 'am' ? 'ድምፅ አጥፋ' : language === 'om' ? 'Mute' : 'Mute')}
            </span>
          </button>
          <LiveClock language={language} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 p-8 bg-[#F8FAFC]">
        <div className="lg:col-span-8 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
            <span className="text-xs uppercase font-extrabold tracking-widest text-blue-600 flex items-center gap-2">
              <Sparkles className="w-4 h-4 fill-blue-600/10" />
              {language === 'am' ? 'አሁን በመጠራት ላይ' : language === 'om' ? 'Amma Waamaa Jira' : 'Now Serving'}
              {totalCalled + totalServing > 0 && (
                <span className="ml-2 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-black">
                  {totalCalled + totalServing} {language === 'am' ? 'በመጠራት ላይ' : language === 'om' ? 'Waamamee' : 'Active'}
                </span>
              )}
            </span>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              {language === 'am' ? 'እባክዎ ወዲያውኑ ወደተጠቀሰው ክፍል ይሂዱ' : language === 'om' ? 'Maaloo saffisaan gara kutaa deemaa' : 'Proceed to Room Immediately'}
            </span>
          </div>

          <div className="space-y-4 min-h-[480px] flex flex-col justify-start">
            <AnimatePresence mode="popLayout">
              {servingPatients.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 rounded-[24px] bg-white border border-slate-100 shadow-sm flex flex-col items-center justify-center text-slate-400 p-8 text-center"
                >
                  <Tv className="w-16 h-16 text-slate-200 mb-3" />
                  <div className="text-sm font-bold text-slate-600 uppercase tracking-widest">
                    {language === 'am' ? 'ወረፋው ባዶ ነው' : language === 'om' ? 'Tarreen Qulqulluudha' : 'Queue Clear'}
                  </div>
                  <p className="text-xs text-slate-400 max-w-xs mt-1">
                    {language === 'am' ? 'ምንም ታካሚ አልተጠራም።' : language === 'om' ? 'Dhukkubsattoonni awaawni waamamee hin jiru.' : 'No patients have been called yet.'}
                  </p>
                </motion.div>
              ) : (
                <div className="space-y-5 flex-1">
                  {(() => {
                    const spotlightPatient = servingPatients[0];
                    const isCalledState = spotlightPatient.status === 'Called';
                    return (
                      <motion.div
                        key={spotlightPatient.id}
                        initial={{ scale: 0.95, opacity: 0, y: 15 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        transition={{ type: 'spring', damping: 18 }}
                        className="bg-white rounded-[32px] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.03)] p-8 flex flex-col justify-between items-center text-center relative overflow-hidden"
                      >
                        <div className="absolute top-0 left-0 w-full h-2 bg-blue-600" />
                        <div className="w-full flex justify-between items-center mb-4">
                          <span className="px-5 py-1.5 bg-blue-50 text-blue-700 text-[10px] font-black rounded-full uppercase tracking-[0.2em]">
                            {isCalledState
                              ? (language === 'am' ? 'አሁን በመጠራት ላይ' : language === 'om' ? 'Amma Waamaa Jira' : 'Now Calling')
                              : (language === 'am' ? 'ምርመራ ላይ' : language === 'om' ? 'Madaallii' : 'In Consultation')}
                          </span>
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                              {spotlightPatient.recommendedDepartment}
                            </span>
                          </div>
                        </div>
                        <div className="flex-1 flex flex-col justify-center items-center py-6">
                          <div className="text-[90px] md:text-[130px] font-black leading-none tracking-tighter text-slate-900 drop-shadow-sm font-sans">
                            {spotlightPatient.id}
                          </div>
                          <div className="mt-4 flex flex-col items-center gap-2">
                            <span className="text-xl font-bold text-slate-800">{maskName(spotlightPatient.name)}</span>
                            <span className="text-sm font-medium text-slate-400 uppercase tracking-widest">
                              {language === 'am' ? 'እባክዎ ወደዚህ ክፍል ይሂዱ' : language === 'om' ? 'Maaloo deemaa gara' : 'Please proceed to'}
                            </span>
                            <div className="px-8 py-3 bg-slate-900 rounded-2xl text-white text-2xl font-bold shadow-lg">
                              {spotlightPatient.assignedRoom || (language === 'am' ? 'መቀበያ' : language === 'om' ? 'Deskii' : 'Reception')}
                            </div>
                          </div>
                        </div>
                        <div className="w-full grid grid-cols-3 gap-4 border-t border-slate-100 pt-6 mt-6">
                          <div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                              {language === 'am' ? 'የመጠበቂያ ጊዜ' : language === 'om' ? 'Yeroo Eegachuu' : 'Est. Wait'}
                            </p>
                            <p className="text-lg font-bold text-slate-800">
                              {spotlightPatient.estimatedWaitMinutes} <span className="text-xs font-medium text-slate-400">{language === 'am' ? 'ደቂቃ' : language === 'om' ? 'daqiiqaa' : 'min'}</span>
                            </p>
                          </div>
                          <div className="border-x border-slate-100">
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                              {language === 'am' ? 'ቅድሚያ' : language === 'om' ? 'Dursa' : 'Priority'}
                            </p>
                            <p className={`text-lg font-bold ${
                              spotlightPatient.triagePriority === 'Emergency' ? 'text-rose-600' :
                              spotlightPatient.triagePriority === 'High' ? 'text-amber-500' : 'text-blue-600'
                            }`}>
                              {spotlightPatient.triagePriority === 'Emergency' ? (language === 'am' ? 'አስቸኳይ' : 'Emergency') :
                               spotlightPatient.triagePriority === 'High' ? (language === 'am' ? 'ከፍተኛ' : 'High') :
                               spotlightPatient.triagePriority === 'Medium' ? (language === 'am' ? 'መካከለኛ' : 'Medium') :
                               (language === 'am' ? 'መደበኛ' : 'Standard')}
                            </p>
                          </div>
                          <div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                              {language === 'am' ? 'ዕድሜ / ጾታ' : language === 'om' ? 'Umrii / Saala' : 'Age / Gender'}
                            </p>
                            <p className="text-lg font-bold text-slate-800">
                              {spotlightPatient.age}y / {spotlightPatient.gender === 'Male' ? 'M' : spotlightPatient.gender === 'Female' ? 'F' : 'O'}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })()}

                  {servingPatients.length > 1 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                      {servingPatients.slice(1).map((patient) => (
                        <div key={patient.id} className="bg-white rounded-[24px] p-5 border border-slate-100 shadow-sm flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">{patient.id}</span>
                              <span className="text-sm font-semibold text-slate-700">{maskName(patient.name)}</span>
                            </div>
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wide block">{patient.recommendedDepartment}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[9px] font-bold text-slate-300 block uppercase">{language === 'am' ? 'ክፍል' : 'Room'}</span>
                            <span className="text-sm font-bold text-blue-600">{patient.assignedRoom || (language === 'am' ? 'ክፍል' : 'TBD')}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
            <span className="text-xs uppercase font-extrabold tracking-widest text-slate-500 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              {language === 'am' ? 'ቀጣይ በመጠባበቂያ ላይ' : language === 'om' ? 'Itti Aanu' : 'Up Next'}
            </span>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              {language === 'am' ? 'በቲኬት ተрак ቅደም ተከተል' : language === 'om' ? 'Tartiiba Tikkee' : 'Ticket Order'}
            </span>
          </div>

          <div className="flex flex-col gap-4 min-h-[480px]">
            {nextPatients.length === 0 ? (
              <div className="flex-1 bg-white border border-slate-100 rounded-[24px] p-6 flex flex-col items-center justify-center text-slate-400 text-center">
                <CheckCircle2 className="w-12 h-12 text-slate-200 mb-2" />
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                  {language === 'am' ? 'ምንም ታካሚ የለም' : language === 'om' ? 'Dhukkubsattoonni Hin Jiru' : 'No Patients Waiting'}
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {language === 'am' ? 'ሁሉም የተመዘገቡ ታካሚዎች ተጠርተዋል።' : language === 'om' ? 'Dhukkubsattoonni hundi waamamanii jiru.' : 'All checked-in patients have been summoned.'}
                </p>
              </div>
            ) : (
              nextPatients.map((patient, index) => {
                const opacities = ["opacity-100", "opacity-90", "opacity-80", "opacity-70", "opacity-60"];
                return (
                  <div key={patient.id} className={`bg-white rounded-[24px] p-5 border border-slate-100 shadow-sm flex items-center justify-between ${opacities[index] || "opacity-100"}`}>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <div className="text-xl font-black text-slate-800 tracking-tight">{patient.id}</div>
                        <p className="text-[10px] text-slate-500 font-semibold mt-0.5">{maskName(patient.name)}</p>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      <span className="text-sm font-bold text-slate-700">
                        {patient.estimatedWaitMinutes} {language === 'am' ? 'ደ' : 'm'}
                      </span>
                      {index === 0 && (
                        <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 animate-pulse uppercase tracking-wider">
                          {language === 'am' ? 'ቀጣይ' : language === 'om' ? 'Itti aanu' : 'NEXT'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            <div className="h-32 bg-blue-600 rounded-[24px] p-5 text-white flex flex-col justify-center relative overflow-hidden shrink-0 shadow-lg shadow-blue-200 mt-auto">
              <div className="relative z-10">
                <p className="text-[9px] font-bold text-blue-200 uppercase tracking-[0.2em] mb-1">
                  {language === 'am' ? 'የታካሚ ማሳሰቢያ' : language === 'om' ? 'Beeksisa Dhukkubsataa' : 'Patient Notice'}
                </p>
                <p className="text-xs font-semibold leading-relaxed">
                  {language === 'am' ? 'እባክዎ ትኬትዎ ከመጠራቱ በፊት የህክምና መታወቂያ ካርድዎን እና የኢንሹራንስ ሰነዶችዎን ያዘጋጁ።' : language === 'om' ? 'Maaloo tikkeen kee waamumuun dura waraqaa eenyummaa fayyaa kee qopheessi.' : 'Please prepare your medical ID card and insurance documents before your ticket is called.'}
                </p>
              </div>
              <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border-t border-slate-100 px-8 py-3.5 text-slate-500 text-xs flex items-center gap-4 overflow-hidden">
        <span className="font-extrabold uppercase tracking-[0.2em] text-blue-600 flex-shrink-0 flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 text-blue-600" /> {language === 'am' ? 'ጠቃሚ መረጃ' : language === 'om' ? 'Beeksisa' : 'Info'}:
        </span>
        <div className="animate-marquee whitespace-nowrap overflow-hidden text-[11px] font-semibold text-slate-400">
          {language === 'am'
            ? 'ታካሚዎች የሚጠሩት በቲኬት ተрак ቅደም ተከተል ነው። ስለ ትብብርዎ እናመሰግናለን። ከባድ ህመም፣ ደም መፍስስ ወይም መተንፈስ መቸገር ካለብዎት ወዲያውኑ ለነርስ ያሳውቁ።'
            : language === 'om'
            ? 'Dhukkubsattoonni kan waamaman akkaataa tartiiba tikkee tti malee akkaataa sa\'aatii dhufaniitiin miti.'
            : 'Patients are called in ticket order. Thank you for your cooperation. If you experience severe pain, bleeding, or breathing difficulty, report immediately.'}
        </div>
      </div>
    </div>
  );
}
