'use client';
import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { 
  X, Clock, Flame, ShieldAlert, CheckCircle2, Heart, 
  RefreshCw, Volume2, VolumeX, AlertCircle, Sparkles, Bell, DoorOpen, Smile
} from 'lucide-react';
import { Patient } from '@/lib/types';
import { playPleasantChime } from '@/lib/utils/audio';

interface PatientStatusModalProps {
  patientId: string;
  patients: Patient[];
  onClose: () => void;
  onRefresh: () => Promise<void>;
}

export default function PatientStatusModal({ patientId, patients, onClose, onRefresh }: PatientStatusModalProps) {
  const [refreshing, setRefreshing] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const prevStatusRef = useRef<string | null>(null);

  const patient = patients.find(p => p.id === patientId);

  useEffect(() => {
    if (patient) {
      if (prevStatusRef.current && prevStatusRef.current !== patient.status && patient.status === 'Called') {
        if (audioEnabled) {
          playPleasantChime();
        }
      }
      prevStatusRef.current = patient.status;
    }
  }, [patient?.status, audioEnabled]);

  const handleManualRefresh = async () => {
    setRefreshing(true);
    await onRefresh();
    setTimeout(() => {
      setRefreshing(false);
    }, 600);
  };

  if (!patient) {
    return (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl text-center space-y-4"
        >
          <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">Ticket Not Found</h3>
          <p className="text-slate-500 text-sm">
            We couldn't locate active record <span className="font-mono font-bold text-slate-700">{patientId}</span>. It may have been archived or removed from the active queue.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl transition-colors text-sm uppercase tracking-wider cursor-pointer"
          >
            Go back to Lancet Hub
          </button>
        </motion.div>
      </div>
    );
  }

  const getQueuePosition = () => {
    if (patient.status !== 'Waiting') return 0;
    
    const sameDeptWaiting = patients.filter(p => 
      p.recommendedDepartment === patient.recommendedDepartment &&
      p.status === 'Waiting' &&
      new Date(p.checkInTime).getTime() < new Date(patient.checkInTime).getTime()
    );
    
    return sameDeptWaiting.length + 1;
  };

  const queuePosition = getQueuePosition();

  const getStatusStepClass = (stepName: 'registered' | 'waiting' | 'called' | 'completed') => {
    const status = patient.status;
    const steps = {
      Waiting: 1,
      Called: 2,
      Serving: 2,
      Completed: 3,
      NoShow: -1
    };

    const currentStepIndex = steps[status] ?? 0;

    let targetIndex = 0;
    if (stepName === 'registered') targetIndex = 0;
    else if (stepName === 'waiting') targetIndex = 1;
    else if (stepName === 'called') targetIndex = 2;
    else if (stepName === 'completed') targetIndex = 3;

    if (status === 'NoShow') {
      return 'border-rose-200 bg-rose-50 text-rose-600';
    }

    if (currentStepIndex >= targetIndex) {
      if (currentStepIndex === targetIndex && (status === 'Called' || status === 'Serving')) {
        return 'border-blue-500 bg-blue-50 text-blue-700 font-extrabold animate-pulse ring-4 ring-blue-500/10';
      }
      return 'border-emerald-500 bg-emerald-50 text-emerald-700 font-bold';
    }
    
    return 'border-slate-200 bg-slate-50 text-slate-400';
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        className="bg-[#F8FAFC] rounded-[32px] max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 flex flex-col my-8"
      >
        {/* Tracker Header */}
        <div className="bg-blue-600 p-6 text-white relative">
          <div className="absolute right-4 top-4 flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setAudioEnabled(!audioEnabled);
                if (!audioEnabled) playPleasantChime();
              }}
              className="p-2 rounded-full hover:bg-white/10 transition-colors text-white"
              title={audioEnabled ? "Mute audio alerts" : "Unmute audio alerts"}
            >
              {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 transition-colors text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white">
              <Heart className="w-5 h-5 fill-blue-100/10" />
            </div>
            <div>
              <span className="text-[10px] tracking-widest uppercase font-bold text-blue-200">Lancet General Patient Portal</span>
              <h2 className="text-lg font-extrabold font-sans leading-tight">Live Arrival Status</h2>
            </div>
          </div>
        </div>

        {/* Live Status Tracker Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-grow">
          {patient.status === 'Called' && (
            <motion.div 
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-amber-500 text-white p-4 rounded-2xl shadow-md border border-amber-400 flex items-center gap-3"
            >
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 animate-bounce">
                <Bell className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="font-extrabold text-sm uppercase tracking-wider">You are Summoned!</div>
                <p className="text-xs text-amber-50 font-medium">
                  Please proceed immediately to <span className="underline font-black">{patient.assignedRoom || "your designated room"}</span>.
                </p>
              </div>
            </motion.div>
          )}

          {patient.status === 'Serving' && (
            <div className="bg-emerald-600 text-white p-4 rounded-2xl shadow-md flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <DoorOpen className="w-5 h-5 text-white animate-pulse" />
              </div>
              <div>
                <div className="font-extrabold text-sm uppercase tracking-wider">In Consultation</div>
                <p className="text-xs text-emerald-50 font-medium">
                  Currently undergoing clinical consultation in <span className="font-black">{patient.assignedRoom || "assigned room"}</span>.
                </p>
              </div>
            </div>
          )}

          {patient.status === 'Completed' && (
            <div className="bg-blue-800 text-white p-4 rounded-2xl shadow-md flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <Smile className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="font-extrabold text-sm uppercase tracking-wider">Consultation Complete</div>
                <p className="text-xs text-blue-50 font-medium">
                  Your visit has concluded. Thank you for using Lancet General.
                </p>
              </div>
            </div>
          )}

          {patient.status === 'NoShow' && (
            <div className="bg-rose-600 text-white p-4 rounded-2xl shadow-md flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <ShieldAlert className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="font-extrabold text-sm uppercase tracking-wider">Missed Call Announcement</div>
                <p className="text-xs text-rose-50 font-medium">
                  Our clinicians called your ticket but you weren't present. Please approach the front desk.
                </p>
              </div>
            </div>
          )}

          {/* Core Ticket Info Board */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/60 shadow-sm space-y-4">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Your Ticket ID</span>
                <div className="text-3xl font-black font-mono text-slate-800 mt-0.5">{patient.id}</div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Patient Name</span>
                <div className="text-base font-extrabold text-slate-700 mt-0.5">{patient.name}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Est. Wait Time</span>
                  <span className="text-sm font-extrabold text-slate-700">
                    {patient.status === 'Completed' ? '0' : patient.estimatedWaitMinutes} mins
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Dept position</span>
                  <span className="text-sm font-extrabold text-slate-700">
                    {patient.status === 'Waiting' ? `#${queuePosition} in line` : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2.5 pt-2 text-xs">
              <div className="flex justify-between items-center text-slate-600">
                <span className="font-medium">Assigned Department:</span>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-bold uppercase tracking-wide text-[10px]">
                  {patient.recommendedDepartment}
                </span>
              </div>

              <div className="flex justify-between items-center text-slate-600">
                <span className="font-medium">Vitals & Urgency Level:</span>
                <span className={`font-bold flex items-center gap-1 ${
                  patient.triagePriority === 'Emergency' ? 'text-rose-500' :
                  patient.triagePriority === 'High' ? 'text-amber-500' :
                  patient.triagePriority === 'Medium' ? 'text-blue-500' : 'text-slate-400'
                }`}>
                  {patient.triagePriority === 'Emergency' && <Flame className="w-3.5 h-3.5 fill-rose-50 text-rose-500" />}
                  {patient.triagePriority} Priority
                </span>
              </div>

              {patient.assignedRoom && (
                <div className="flex justify-between items-center text-slate-600 border-t border-slate-100 pt-2 mt-1">
                  <span className="font-bold text-blue-600">Assigned Consultation Room:</span>
                  <span className="px-3 py-1 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg font-black text-xs uppercase tracking-wider">
                    {patient.assignedRoom}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Visual Progress Steps */}
          <div className="space-y-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Live Treatment Journey</span>
            <div className="flex flex-col gap-2.5">
              <div className={`flex items-center gap-3 p-3 rounded-2xl border ${getStatusStepClass('registered')}`}>
                <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center font-bold text-xs flex-shrink-0">✓</div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wide">1. Reception Intake Complete</div>
                  <p className="text-[10px] opacity-80 font-medium">Demographics, symptoms logged and categorized</p>
                </div>
              </div>

              <div className={`flex items-center gap-3 p-3 rounded-2xl border ${getStatusStepClass('waiting')}`}>
                <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center font-bold text-xs flex-shrink-0">
                  {patient.status !== 'Waiting' ? '✓' : '•'}
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wide">2. Assigned Queue & Waiting</div>
                  <p className="text-[10px] opacity-80 font-medium">Please wait in the main lobby or nearby cafe</p>
                </div>
              </div>

              <div className={`flex items-center gap-3 p-3 rounded-2xl border ${getStatusStepClass('called')}`}>
                <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center font-bold text-xs flex-shrink-0">
                  {patient.status === 'Completed' ? '✓' : (patient.status === 'Called' || patient.status === 'Serving' ? '•' : '3')}
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wide">3. Room Consultation Calling</div>
                  <p className="text-[10px] opacity-80 font-medium">
                    {patient.assignedRoom ? `Proceed to ${patient.assignedRoom}` : 'Clinician calls your ticket'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {patient.aiAnalysis?.clinicalPrecaution && (
            <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100/50 space-y-2 text-xs text-slate-600">
              <div className="font-bold text-blue-800 flex items-center gap-1.5 uppercase tracking-wider">
                <AlertCircle className="w-3.5 h-3.5 text-blue-600" />
                Your Safety Instructions:
              </div>
              <p className="leading-relaxed">
                {patient.aiAnalysis.clinicalPrecaution}
              </p>
            </div>
          )}

          <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-slate-400 bg-slate-100 p-2.5 rounded-xl uppercase tracking-widest border border-slate-200/50">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Real-Time Connected to Lancet Core
          </div>
        </div>

        {/* Action button panel */}
        <div className="p-6 bg-white border-t border-slate-100 flex gap-3">
          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="w-1/3 border border-slate-200 hover:bg-slate-50 text-slate-500 font-bold py-3 px-4 rounded-xl transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-2/3 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-all text-xs uppercase tracking-wider shadow-md hover:shadow-lg hover:shadow-blue-100 text-center cursor-pointer"
          >
            Close Status Portal
          </button>
        </div>
      </motion.div>
    </div>
  );
}
