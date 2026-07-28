'use client';
import { useState, useEffect, useRef, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Volume2, VolumeX, Bell, Tv, MapPin, Sparkles, CheckCircle2, AlertCircle, Clock, Trash2 } from 'lucide-react';
import { Patient } from '@/lib/types';
import { Language } from '@/lib/utils/translations';
import { speakText, speakTicket, stopSpeech } from '@/lib/utils/tts';
import { playPleasantChime } from '@/lib/utils/audio';

interface WaitingBoardProps {
  patients: Patient[];
  language?: Language;
  isOffline?: boolean;
  onCallNext?: () => void;
  onClearQueue?: () => void;
}

function LiveClock({ language }: { language: Language }) {
  const [time, setTime] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  return (
    <div className="text-right">
      <div className="text-5xl xl:text-6xl font-black text-white tabular-nums leading-none">
        {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
      </div>
      <div className="text-lg text-blue-300 font-bold uppercase tracking-wider mt-1">
        {time.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
      </div>
    </div>
  );
}

function parseTicketNumber(id: string): number {
  const match = id.match(/P-(\d+)/);
  return match ? parseInt(match[1], 10) : 999999;
}

function WaitingBoard({ patients, language = 'en', isOffline = false, onCallNext, onClearQueue }: WaitingBoardProps) {
  const [audioEnabled, setAudioEnabled] = useState(true);
  const lastCalledIdRef = useRef<string | null>(null);

  const servingPatients = useMemo(
    () => patients.filter(p => p.status === 'Called' || p.status === 'Serving'),
    [patients]
  );

  const nextPatients = useMemo(() => {
    return patients
      .filter(p => p.status === 'Waiting')
      .sort((a, b) => parseTicketNumber(a.id) - parseTicketNumber(b.id))
      .slice(0, 12);
  }, [patients]);

  const totalWaiting = useMemo(() => patients.filter(p => p.status === 'Waiting').length, [patients]);
  const totalCalled = useMemo(() => patients.filter(p => p.status === 'Called').length, [patients]);
  const totalServing = useMemo(() => patients.filter(p => p.status === 'Serving').length, [patients]);

  useEffect(() => {
    const calledPatient = patients.find(p => p.status === 'Called' && p.assignedRoom);
    if (calledPatient && calledPatient.id !== lastCalledIdRef.current) {
      lastCalledIdRef.current = calledPatient.id;
      if (audioEnabled) {
        triggerVoiceCall(calledPatient);
      }
    }
  }, [patients, audioEnabled]);

  const triggerVoiceCall = async (patient: Patient) => {
    playPleasantChime();
    setTimeout(() => {
      speakTicket(patient.id, patient.assignedRoom || 'Desk');
    }, 1200);
  };

  const maskName = (fullName: string) => {
    const parts = fullName.trim().split(" ");
    if (parts.length === 1) return parts[0];
    return `${parts[0]} ${parts[parts.length - 1][0]}.`;
  };

  return (
    <div id="waiting-board" className="h-screen w-screen flex flex-col bg-slate-900 overflow-hidden font-sans select-none">

      {/* Top Bar */}
      <div className="bg-slate-900 border-b border-slate-700/50 px-8 xl:px-12 py-5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/30">
            <Tv className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl xl:text-3xl font-black uppercase tracking-wider text-white flex items-center gap-3">
              {language === 'am' ? 'ላንሴት አጠቃላይ ሆስፒታል' : language === 'om' ? 'Hospitaal General Lancet' : 'Lancet General Hospital'}
              {isOffline ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-600 text-white text-sm font-black uppercase tracking-widest animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-white"></span> Offline
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-600/20 text-emerald-400 text-sm font-black uppercase tracking-widest">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span> Live
                </span>
              )}
            </h2>
            <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-0.5">
              {language === 'am' ? 'የቀጥታ ወረፋ መከታተያ ሰሌዳ' : language === 'om' ? 'Moniitara Tarree Yeroo Dhugaa' : 'Live Queue Monitor Board'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-8">
          {/* Stats pills */}
          <div className="flex items-center gap-4">
            <div className="bg-slate-800 rounded-xl px-5 py-2.5 border border-slate-700 flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-amber-400 animate-pulse"></span>
              <span className="text-2xl font-black text-white">{totalWaiting}</span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {language === 'am' ? 'በመጠባበቂያ ላይ' : language === 'om' ? 'Eeggataa' : 'Waiting'}
              </span>
            </div>
            <div className="bg-blue-600/20 rounded-xl px-5 py-2.5 border border-blue-500/30 flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-blue-400 animate-pulse"></span>
              <span className="text-2xl font-black text-blue-400">{totalCalled + totalServing}</span>
              <span className="text-xs font-bold text-blue-300 uppercase tracking-wider">
                {language === 'am' ? 'በመጠራት ላይ' : language === 'om' ? 'Waamamee' : 'Active'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setAudioEnabled(!audioEnabled);
              if (!audioEnabled) {
                speakText("Voice alerts enabled", "Voice alerts enabled");
              } else {
                stopSpeech();
              }
            }}
            className={`flex items-center gap-2 text-sm py-2 px-4 rounded-xl border transition-all ${
              audioEnabled ? 'bg-blue-600 border-blue-500 text-white font-bold' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            {audioEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            <span className="font-bold text-xs uppercase tracking-wider">
              {audioEnabled ? (language === 'am' ? 'ድምፅ በርቷል' : language === 'om' ? 'Sagalee ON' : 'Voice ON') : (language === 'am' ? 'ድምፅ አጥፋ' : language === 'om' ? 'Mute' : 'Mute')}
            </span>
          </button>

          {onClearQueue && (
            <button
              type="button"
              onClick={onClearQueue}
              className="flex items-center gap-2 text-sm py-2 px-4 rounded-xl border border-rose-500/30 bg-rose-600/20 text-rose-400 hover:bg-rose-600 hover:text-white hover:border-rose-500 transition-all font-bold"
            >
              <Trash2 className="w-5 h-5" />
              <span className="font-bold text-xs uppercase tracking-wider">
                {language === 'am' ? 'ሁሉንም አጽዳ' : language === 'om' ? 'Hunda Haquq' : 'Clear All'}
              </span>
            </button>
          )}

          <div className="h-14 w-px bg-slate-700"></div>
          <LiveClock language={language} />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 grid grid-cols-12 gap-0 min-h-0">

        {/* Now Serving — Left Side */}
        <div className="col-span-8 flex flex-col border-r border-slate-700/50 min-h-0">
          <div className="px-8 xl:px-10 py-5 flex items-center justify-between border-b border-slate-700/30 shrink-0">
            <span className="text-lg uppercase font-black tracking-widest text-blue-400 flex items-center gap-3">
              <Sparkles className="w-6 h-6 fill-blue-400/20" />
              {language === 'am' ? 'አሁን በመጠራት ላይ' : language === 'om' ? 'Amma Waamaa Jira' : 'Now Serving'}
              {totalCalled + totalServing > 0 && (
                <span className="ml-2 px-3 py-1 rounded-full bg-blue-600 text-white text-sm font-black">
                  {totalCalled + totalServing}
                </span>
              )}
            </span>
            <span className="text-sm text-slate-500 font-bold uppercase tracking-wider">
              {language === 'am' ? 'እባክዎ ወዲያውኑ ወደተጠቀሰው ክፍል ይሂዱ' : language === 'om' ? 'Maaloo saffisaan gara kutaa deemaa' : 'Proceed to Room Immediately'}
            </span>
          </div>

          <div className="flex-1 p-8 xl:p-10 flex flex-col justify-center min-h-0">
            <AnimatePresence mode="popLayout">
              {servingPatients.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 rounded-3xl bg-slate-800/50 border border-slate-700/50 flex flex-col items-center justify-center text-slate-500 p-8 text-center"
                >
                  <Tv className="w-24 h-24 text-slate-700 mb-4" />
                  <div className="text-3xl font-black text-slate-600 uppercase tracking-widest">
                    {language === 'am' ? 'ወረፋው ባዶ ነው' : language === 'om' ? 'Tarreen Qulqulluudha' : 'Queue Clear'}
                  </div>
                  <p className="text-lg text-slate-500 mt-2">
                    {language === 'am' ? 'ምንም ታካሚ አልተጠራም።' : language === 'om' ? 'Dhukkubsattoonni awaawni waamamee hin jiru.' : 'No patients have been called yet.'}
                  </p>
                </motion.div>
              ) : (
                <div className="flex-1 flex flex-col gap-6 min-h-0">
                  {/* Spotlight patient */}
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
                        className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl border border-slate-700/50 shadow-2xl p-8 xl:p-10 flex flex-col relative overflow-hidden flex-1"
                      >
                        {/* Animated top accent */}
                        <div className={`absolute top-0 left-0 w-full h-1.5 ${isCalledState ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 animate-pulse' : 'bg-gradient-to-r from-blue-500 to-indigo-500'}`} />

                        <div className="flex justify-between items-start mb-6">
                          <span className={`px-6 py-2 text-lg font-black rounded-full uppercase tracking-[0.15em] ${
                            isCalledState
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          }`}>
                            {isCalledState
                              ? (language === 'am' ? 'አሁን በመጠራት ላይ' : language === 'om' ? 'Amma Waamaa Jira' : 'NOW CALLING')
                              : (language === 'am' ? 'ምርመራ ላይ' : language === 'om' ? 'Madaallii' : 'IN CONSULTATION')}
                          </span>
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="text-base font-bold text-slate-400 uppercase tracking-widest">
                              {spotlightPatient.recommendedDepartment}
                            </span>
                          </div>
                        </div>

                        {/* BIG TICKET NUMBER */}
                        <div className="flex-1 flex flex-col justify-center items-center py-4">
                          <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: 'spring', damping: 12, stiffness: 100 }}
                            className="text-[120px] sm:text-[160px] xl:text-[200px] 2xl:text-[240px] font-black leading-none tracking-tighter text-white drop-shadow-2xl font-mono"
                          >
                            {spotlightPatient.id}
                          </motion.div>

                          <div className="mt-6 flex flex-col items-center gap-3">
                            <span className="text-3xl font-bold text-slate-300">{maskName(spotlightPatient.name)}</span>
                            <span className="text-lg font-medium text-slate-500 uppercase tracking-widest">
                              {language === 'am' ? 'እባክዎ ወደዚህ ክፍል ይሂዱ' : language === 'om' ? 'Maaloo deemaa gara' : 'Please proceed to'}
                            </span>
                            <div className="px-10 py-4 bg-white rounded-2xl text-slate-900 text-4xl font-black shadow-xl shadow-white/10">
                              {spotlightPatient.assignedRoom || (language === 'am' ? 'ወደ ዴስክ' : language === 'om' ? 'Deskii' : 'Reception Desk')}
                            </div>
                          </div>
                        </div>

                        {/* Bottom stats */}
                        <div className="w-full grid grid-cols-3 gap-6 border-t border-slate-700/50 pt-6 mt-4">
                          <div>
                            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">
                              {language === 'am' ? 'የመጠበቂያ ጊዜ' : language === 'om' ? 'Yeroo Eegachuu' : 'Est. Wait'}
                            </p>
                            <p className="text-3xl font-black text-white">
                              {spotlightPatient.estimatedWaitMinutes} <span className="text-lg font-medium text-slate-400">{language === 'am' ? 'ደቂቃ' : language === 'om' ? 'daqiiqaa' : 'min'}</span>
                            </p>
                          </div>
                          <div className="border-x border-slate-700/50">
                            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">
                              {language === 'am' ? 'ቅድሚያ' : language === 'om' ? 'Dursa' : 'Priority'}
                            </p>
                            <p className={`text-3xl font-black ${
                              spotlightPatient.triagePriority === 'Emergency' ? 'text-rose-400' :
                              spotlightPatient.triagePriority === 'High' ? 'text-amber-400' : 'text-blue-400'
                            }`}>
                              {spotlightPatient.triagePriority === 'Emergency' ? (language === 'am' ? 'አስቸኳይ' : 'EMERGENCY') :
                               spotlightPatient.triagePriority === 'High' ? (language === 'am' ? 'ከፍተኛ' : 'HIGH') :
                               spotlightPatient.triagePriority === 'Medium' ? (language === 'am' ? 'መካከለኛ' : 'MEDIUM') :
                               (language === 'am' ? 'መደበኛ' : 'STANDARD')}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">
                              {language === 'am' ? 'ዕድሜ / ጾታ' : language === 'om' ? 'Umrii / Saala' : 'Age / Gender'}
                            </p>
                            <p className="text-3xl font-black text-white">
                              {spotlightPatient.age} / {spotlightPatient.gender === 'Male' ? 'M' : spotlightPatient.gender === 'Female' ? 'F' : 'O'}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })()}

                  {/* Additional serving patients */}
                  {servingPatients.length > 1 && (
                    <div className="grid grid-cols-2 xl:grid-cols-3 gap-4 shrink-0">
                      {servingPatients.slice(1).map((patient) => (
                        <div key={patient.id} className="bg-slate-800 rounded-2xl p-5 border border-slate-700/50 flex items-center justify-between">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-3">
                              <span className="font-mono text-xl font-black bg-slate-700 text-white px-3 py-1 rounded-lg">{patient.id}</span>
                              <span className="text-lg font-bold text-white">{maskName(patient.name)}</span>
                            </div>
                            <span className="text-sm text-slate-400 font-bold uppercase tracking-wide block">{patient.recommendedDepartment}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-bold text-slate-500 block uppercase">{language === 'am' ? 'ክፍል' : 'Room'}</span>
                            <span className="text-xl font-bold text-blue-400">{patient.assignedRoom || (language === 'am' ? 'ክፍል' : 'TBD')}</span>
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

        {/* Up Next — Right Side */}
        <div className="col-span-4 flex flex-col min-h-0">
          <div className="px-8 py-5 flex items-center justify-between border-b border-slate-700/30 shrink-0">
            <span className="text-lg uppercase font-black tracking-widest text-slate-400 flex items-center gap-3">
              <Clock className="w-6 h-6 text-slate-500" />
              {language === 'am' ? 'ቀጣይ በመጠባበቂያ ላይ' : language === 'om' ? 'Itti Aanu' : 'Up Next'}
            </span>
            <span className="text-sm text-slate-500 font-bold uppercase tracking-wider">
              {language === 'am' ? 'በቲኬት ተрак ቅደም ተከተል' : language === 'om' ? 'Tartiiba Tikkee' : 'Ticket Order'}
            </span>
          </div>

          <div className="flex-1 p-6 flex flex-col gap-3 overflow-hidden min-h-0">
            {nextPatients.length === 0 ? (
              <div className="flex-1 bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 flex flex-col items-center justify-center text-slate-500 text-center">
                <CheckCircle2 className="w-16 h-16 text-slate-700 mb-3" />
                <div className="text-xl font-black text-slate-500 uppercase tracking-widest">
                  {language === 'am' ? 'ምንም ታካሚ የለም' : language === 'om' ? 'Dhukkubsattoonni Hin Jiru' : 'No Patients Waiting'}
                </div>
                <p className="text-sm text-slate-500 mt-1">
                  {language === 'am' ? 'ሁሉም የተመዘገቡ ታካሚዎች ተጠርተዋል።' : language === 'om' ? 'Dhukkubsattoonni hundi waamamanii jiru.' : 'All checked-in patients have been summoned.'}
                </p>
              </div>
            ) : (
              nextPatients.map((patient, index) => {
                const opacities = ["opacity-100", "opacity-90", "opacity-80", "opacity-70", "opacity-60", "opacity-50", "opacity-50", "opacity-50", "opacity-50", "opacity-50", "opacity-50", "opacity-50"];
                return (
                  <div key={patient.id} className={`bg-slate-800 rounded-2xl px-6 py-4 border border-slate-700/50 flex items-center justify-between ${opacities[index] || "opacity-40"}`}>
                    <div className="flex items-center gap-5">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg ${
                        index === 0 ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <div className="text-2xl font-black text-white tracking-tight font-mono">{patient.id}</div>
                        <p className="text-sm text-slate-400 font-semibold mt-0.5">{maskName(patient.name)}</p>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1.5">
                      <span className="text-xl font-bold text-slate-300">
                        {patient.estimatedWaitMinutes} <span className="text-sm text-slate-500">{language === 'am' ? 'ደ' : 'm'}</span>
                      </span>
                      {index === 0 && (
                        <span className="text-xs font-black px-3 py-1 rounded-full bg-blue-600 text-white animate-pulse uppercase tracking-wider">
                          {language === 'am' ? 'ቀጣይ' : language === 'om' ? 'Itti aanu' : 'NEXT'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Patient Notice */}
          <div className="mx-6 mb-6 bg-blue-600 rounded-2xl p-6 text-white shrink-0 shadow-lg shadow-blue-600/20">
            <p className="text-sm font-bold text-blue-200 uppercase tracking-[0.15em] mb-1.5">
              {language === 'am' ? 'የታካሚ ማሳሰቢያ' : language === 'om' ? 'Beeksisa Dhukkubsataa' : 'Patient Notice'}
            </p>
            <p className="text-base font-semibold leading-relaxed text-blue-50">
              {language === 'am' ? 'እባክዎ ትኬትዎ ከመጠራቱ በፊት የህክምና መታወቂያ ካርድዎን እና የኢንሶራንስ ሰነዶችዎን ያዘጋጁ።' : language === 'om' ? 'Maaloo tikkeen kee waamumuun dura waraqaa eenyummaa fayyaa kee qopheessi.' : 'Please prepare your medical ID card and insurance documents before your ticket is called.'}
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Ticker */}
      <div className="bg-blue-600 px-8 py-3 text-white flex items-center gap-4 overflow-hidden shrink-0">
        <span className="font-black uppercase tracking-[0.2em] text-blue-100 flex-shrink-0 flex items-center gap-2 text-sm">
          <AlertCircle className="w-5 h-5" /> {language === 'am' ? 'ጠቃሚ መረጃ' : language === 'om' ? 'Beeksisa' : 'INFO'}:
        </span>
        <div className="animate-marquee whitespace-nowrap overflow-hidden text-base font-semibold text-blue-100">
          {language === 'am'
            ? 'ታካሚዎች የሚጠሩት በቲኬት ተрак ቅደም ተከተል ነው። ስለ ትብብርዎ እናመሰግናለን። ከባድ ህመም፣ ደም መፍስስ ወይም መተንፈስ መቸገር ካለብዎት ወዲያውኑ ለነርስ ያሳውቁ።'
            : language === 'om'
            ? 'Dhukkubsattoonni kan waamaman akkaataa tartiiba tikkee tti malee akkaataa sa\'aatii dhufaniitiin miti.'
            : 'Patients are called in ticket order. Thank you for your cooperation. If you experience severe pain, bleeding, or breathing difficulty, report immediately to the nurse station.'}
        </div>
      </div>
    </div>
  );
}

export default memo(WaitingBoard);
