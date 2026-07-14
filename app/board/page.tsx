'use client';
import usePatients from '@/lib/hooks/usePatients';
import dynamic from 'next/dynamic';
import { Globe } from 'lucide-react';
import { Language } from '@/lib/utils/translations';
import { useState } from 'react';

const WaitingBoard = dynamic(() => import('@/lib/components/WaitingBoard'), { ssr: false });

export default function BoardPage() {
  const { patients, error } = usePatients();
  const [language, setLanguage] = useState<Language>('en');

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-900">
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200/40">
        <Globe className="w-3.5 h-3.5 text-slate-500 animate-spin-slow" />
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value as Language)}
          className="bg-transparent border-none text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer pr-2"
        >
          <option value="en">English</option>
          <option value="am">Amharic</option>
          <option value="om">Afaan Oromoo</option>
        </select>
      </div>
      <WaitingBoard patients={patients} language={language} isOffline={!!error} />
    </div>
  );
}
