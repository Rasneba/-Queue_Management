'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ArrowRight } from 'lucide-react';
import { BrandMark } from '@/lib/components/ui';

export default function TrackPage() {
  const [token, setToken] = useState('');
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (token.trim()) {
      router.push(`/track/${token.trim().toUpperCase()}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 animate-fade-up">
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <BrandMark className="w-14 h-14" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Track Your Queue Status</h1>
          <p className="text-sm text-slate-500">Enter your ticket number to see your position and estimated wait time</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl text-lg font-mono font-bold text-slate-800 text-center uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 shadow-sm"
              placeholder="e.g. GEN-107"
              value={token}
              onChange={(e) => setToken(e.target.value.toUpperCase())}
              autoFocus
            />
          </div>
          <button
            type="submit"
            disabled={!token.trim()}
            className="w-full py-3.5 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            Track Status
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center">
          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
            Lancet General Hospital - Megenagna, Addis Ababa
          </p>
        </div>
      </div>
    </div>
  );
}
