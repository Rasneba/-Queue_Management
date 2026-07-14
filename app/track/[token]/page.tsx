'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { BrandMark, StatusBadge, Spinner } from '@/lib/components/ui';
import { MapPin, Clock, Users, ArrowLeft, Phone } from 'lucide-react';

interface TrackData {
  patient: {
    id: string;
    name: string;
    age: number;
    gender: string;
    symptoms: string;
    triagePriority: string;
    triageScore: number;
    recommendedDepartment: string;
    assignedRoom: string | null;
    status: string;
    checkInTime: string;
    calledTime: string | null;
    completedTime: string | null;
    estimatedWaitMinutes: number;
  };
  position: number | null;
  estimatedWait: number;
  nowServing: string | null;
  peopleAhead: number;
}

const STATUS_BANNERS: Record<string, { bg: string; icon: string; text: string }> = {
  Waiting: { bg: "from-teal-500 to-emerald-500", icon: "clock", text: "Please wait, you are in the queue" },
  Called: { bg: "from-amber-500 to-orange-500", icon: "bell", text: "Your ticket has been called! Please proceed now" },
  Serving: { bg: "from-blue-500 to-indigo-500", icon: "stethoscope", text: "You are currently in consultation" },
  Completed: { bg: "from-emerald-500 to-teal-500", icon: "check", text: "Your consultation is complete" },
  NoShow: { bg: "from-rose-500 to-pink-500", icon: "alert", text: "You have been marked as no-show" },
};

export default function TrackTokenPage() {
  const params = useParams();
  const token = params.token as string;
  const [data, setData] = useState<TrackData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    const fetchTrack = async () => {
      try {
        const res = await fetch(`/api/track/${token}`);
        if (!res.ok) throw new Error('Token not found');
        const json = await res.json();
        setData(json);
        setError('');
      } catch {
        setError('Token not found. Please check your ticket number.');
      } finally {
        setLoading(false);
      }
    };
    fetchTrack();
    const interval = setInterval(fetchTrack, 5000);
    return () => clearInterval(interval);
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center p-4">
        <div className="text-center space-y-4 animate-fade-up">
          <BrandMark className="w-12 h-12 mx-auto" />
          <h1 className="text-xl font-extrabold text-slate-800">Token Not Found</h1>
          <p className="text-sm text-slate-500">{error}</p>
          <Link href="/track" className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Try another token
          </Link>
        </div>
      </div>
    );
  }

  const { patient, position, estimatedWait, nowServing, peopleAhead } = data;
  const banner = STATUS_BANNERS[patient.status] || STATUS_BANNERS.Waiting;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 p-4">
      <div className="max-w-md mx-auto space-y-4 pt-8">
        {/* Token Hero */}
        <div className={`bg-gradient-to-br ${banner.bg} rounded-3xl p-6 text-white text-center shadow-xl animate-fade-up`}>
          <div className="flex items-center justify-center gap-2 mb-3">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">Live Status</span>
          </div>
          <div className="text-4xl font-mono font-extrabold tracking-widest mb-2">{patient.id}</div>
          <div className="text-sm opacity-80 font-medium">{patient.recommendedDepartment}</div>
        </div>

        {/* Status Card */}
        {patient.status === "Waiting" && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 animate-pop">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-teal-50 rounded-xl p-3">
                <div className="text-2xl font-extrabold text-teal-600">{position}</div>
                <div className="text-[10px] font-bold text-teal-500 uppercase">Position</div>
              </div>
              <div className="bg-slate-900 rounded-xl p-3 text-white">
                <div className="text-2xl font-extrabold">{estimatedWait}<span className="text-sm">m</span></div>
                <div className="text-[10px] font-bold uppercase opacity-70">Est. Wait</div>
              </div>
              <div className="bg-slate-50 rounded-xl p-3">
                <div className="text-2xl font-extrabold text-slate-700">{peopleAhead}</div>
                <div className="text-[10px] font-bold text-slate-500 uppercase">Ahead</div>
              </div>
            </div>
            {position !== null && position <= 1 && (
              <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
                <div className="text-sm font-bold text-emerald-700">You&apos;re next!</div>
                <div className="text-[10px] text-emerald-600">Please stay near the reception area</div>
              </div>
            )}
            {nowServing && (
              <div className="mt-3 flex items-center justify-center gap-2 text-xs text-slate-500">
                <Users className="w-3.5 h-3.5" />
                Now serving: <span className="font-mono font-bold text-slate-700">{nowServing}</span>
              </div>
            )}
          </div>
        )}

        {patient.status === "Called" && (
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-5 text-white text-center shadow-xl animate-pop">
            <div className="text-3xl mb-2">🔔</div>
            <div className="text-lg font-extrabold mb-1">Your Ticket Has Been Called!</div>
            <div className="text-sm opacity-80">Please proceed to {patient.assignedRoom || 'the consultation room'} immediately</div>
          </div>
        )}

        {patient.status === "Serving" && (
          <div className="bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl p-5 text-white text-center shadow-xl animate-pop">
            <div className="text-3xl mb-2">🩺</div>
            <div className="text-lg font-extrabold mb-1">In Consultation</div>
            <div className="text-sm opacity-80">You are currently being attended to by the doctor</div>
          </div>
        )}

        {patient.status === "Completed" && (
          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-5 text-white text-center shadow-xl animate-pop">
            <div className="text-3xl mb-2">✅</div>
            <div className="text-lg font-extrabold mb-1">Consultation Complete</div>
            <div className="text-sm opacity-80">Thank you for visiting Lancet General Hospital</div>
          </div>
        )}

        {/* Patient Info */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Ticket Details</h3>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <div className="text-slate-400 font-medium">Patient</div>
              <div className="font-bold text-slate-700">{patient.name}</div>
            </div>
            <div>
              <div className="text-slate-400 font-medium">Age/Gender</div>
              <div className="font-bold text-slate-700">{patient.age}y / {patient.gender}</div>
            </div>
            <div className="col-span-2">
              <div className="text-slate-400 font-medium">Symptoms</div>
              <div className="text-slate-600 mt-0.5">{patient.symptoms}</div>
            </div>
            <div>
              <div className="text-slate-400 font-medium">Priority</div>
              <StatusBadge status={patient.triagePriority} />
            </div>
            <div>
              <div className="text-slate-400 font-medium">Room</div>
              <div className="font-bold text-slate-700">{patient.assignedRoom || 'Pending assignment'}</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center space-y-2 pt-4">
          <Link href="/track" className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-700">
            <ArrowLeft className="w-3.5 h-3.5" /> Track another ticket
          </Link>
          <div className="flex items-center justify-center gap-3 text-[10px] text-slate-400">
            <div className="flex items-center gap-1"><MapPin className="w-3 h-3" /> Megenagna, Addis Ababa</div>
            <div className="flex items-center gap-1"><Phone className="w-3 h-3" /> +251 977 171 71</div>
          </div>
          <div className="flex items-center justify-center gap-1.5">
            <BrandMark className="w-4 h-4" />
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Lancet General Hospital</span>
          </div>
        </div>
      </div>
    </div>
  );
}
