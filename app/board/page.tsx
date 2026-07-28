'use client';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Maximize, Monitor, Trash2, Home } from 'lucide-react';
import { Language } from '@/lib/utils/translations';
import useActivePatients from '@/lib/hooks/useActivePatients';

const WaitingBoard = dynamic(() => import('@/lib/components/WaitingBoard'));

export default function BoardPage() {
  const [language, setLanguage] = useState<Language>('en');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showPrompt, setShowPrompt] = useState(true);
  const [clearing, setClearing] = useState(false);
  const { patients, error, refresh } = useActivePatients();

  useEffect(() => {
    const saved = localStorage.getItem('app_language');
    if (saved === 'am' || saved === 'om') setLanguage(saved);
  }, []);

  useEffect(() => {
    const onChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      if (document.fullscreenElement) setShowPrompt(false);
    };
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const enterFullscreen = async () => {
    try {
      await document.documentElement.requestFullscreen();
      setShowPrompt(false);
    } catch {
      setShowPrompt(false);
    }
  };

  const toggleFullscreen = async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await document.documentElement.requestFullscreen();
    }
  };

  const clearQueue = async () => {
    if (!window.confirm('Clear all patient data from the waiting area? This cannot be undone.')) return;
    setClearing(true);
    try {
      const res = await fetch('/api/reset', { method: 'POST' });
      if (!res.ok) throw new Error('Reset failed');
      refresh();
    } catch {
      alert('Failed to clear queue');
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      <Link
        href="/"
        className="fixed top-4 left-4 z-[60] flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-900 text-white text-xs font-bold backdrop-blur transition-colors"
        title="Back to Home"
      >
        <Home className="w-4 h-4" />
        <span className="hidden sm:inline">Back to Home</span>
      </Link>

      {showPrompt && (
        <div
          className="absolute inset-0 z-50 bg-slate-900/95 backdrop-blur-sm flex items-center justify-center cursor-pointer"
          onClick={enterFullscreen}
        >
          <div className="text-center space-y-6 animate-pulse">
            <div className="w-20 h-20 mx-auto bg-blue-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-600/40">
              <Monitor className="w-10 h-10 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight mb-2">
                Lancet General Hospital
              </h1>
              <p className="text-lg text-slate-400 font-semibold">Waiting Board</p>
            </div>
            <div className="bg-blue-600 hover:bg-blue-500 transition-colors rounded-2xl px-8 py-4 inline-flex items-center gap-3 text-white font-bold text-lg shadow-xl shadow-blue-600/30">
              <Maximize className="w-6 h-6" />
              Click to Enter Fullscreen
            </div>
            <p className="text-sm text-slate-500">Optimized for 43"+ TV displays</p>
          </div>
        </div>
      )}

      {!showPrompt && !isFullscreen && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2">
          <button
            onClick={clearQueue}
            disabled={clearing}
            className="bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white p-3 rounded-xl shadow-2xl border border-rose-500 transition-all"
            title="Clear All Queue Data"
          >
            <Trash2 className="w-5 h-5" />
          </button>
          <button
            onClick={toggleFullscreen}
            className="bg-slate-800 hover:bg-slate-700 text-white p-3 rounded-xl shadow-2xl border border-slate-700 transition-all opacity-60 hover:opacity-100"
            title="Toggle Fullscreen"
          >
            <Maximize className="w-5 h-5" />
          </button>
        </div>
      )}

      <WaitingBoard patients={patients} language={language} isOffline={!!error} onClearQueue={clearQueue} />
    </div>
  );
}
