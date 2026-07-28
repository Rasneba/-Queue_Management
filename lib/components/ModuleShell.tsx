'use client';

import { useState, useEffect, useCallback, createContext, useContext, memo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Home, Globe, Moon, Sun, AlertCircle, RefreshCw } from 'lucide-react';
import { Language, t } from '@/lib/utils/translations';
import { preloadVoices } from '@/lib/utils/tts';
import LiveClock from '@/lib/components/Clock';

interface ShellCtx {
  language: Language;
  darkMode: boolean;
}

const ModuleShellCtx = createContext<ShellCtx>({ language: 'en', darkMode: false });

export function useModuleShell() {
  return useContext(ModuleShellCtx);
}

interface ModuleShellProps {
  /** Module view. Receives the live language + dark mode so views stay in sync. */
  children: React.ReactNode | ((ctx: ShellCtx) => React.ReactNode);
  /** Optional title shown as the module name. */
  eyebrow?: string;
  /** Connection error string; renders a non-blocking retry banner. */
  error?: string | null;
  /** Retry handler for the error banner. */
  onRetry?: () => void;
  /** When true the main content area has no padding (for edge-to-edge modules). */
  bleed?: boolean;
}

function ShellClock() {
  return (
    <div className="hidden md:flex items-center gap-3 text-right pl-3 border-l border-slate-200 dark:border-slate-700">
      <LiveClock
        timeClassName="text-xl font-black tabular-nums text-slate-800 dark:text-slate-100 leading-none"
        dateClassName="text-[9px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mt-0.5"
      />
    </div>
  );
}

function TopBar({
  language,
  darkMode,
  onLang,
  onDark,
  error,
  onRetry,
}: {
  language: Language;
  darkMode: boolean;
  onLang: (l: Language) => void;
  onDark: (d: boolean) => void;
  error?: string | null;
  onRetry?: () => void;
}) {
  return (
    <header className="shrink-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 z-40">
      <div className="w-full px-4 sm:px-6 flex items-center justify-between h-14 gap-3">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Image src="/lancetlogo.png" alt="Lancet General Hospital" width={36} height={36} className="h-9 w-auto object-contain" />
          <div className="hidden sm:block">
            <h1 className="text-sm font-extrabold tracking-tight text-slate-800 dark:text-slate-100 leading-none">
              {t('hospitalName', language)}
            </h1>
            <p className="text-[8px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-[0.15em] leading-none mt-0.5">
              {t('aiTriageHub', language)}
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-bold transition-colors"
            title="Back to Home"
          >
            <Home className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Home</span>
          </Link>

          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200/40 dark:border-slate-700/40">
            <Globe className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <select
              value={language}
              onChange={(e) => onLang(e.target.value as Language)}
              className="bg-transparent border-none text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer pr-1 outline-none"
            >
              <option value="en">EN</option>
              <option value="am">AM</option>
              <option value="om">OM</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => onDark(!darkMode)}
            className="flex items-center justify-center py-1.5 px-2.5 rounded-xl border border-slate-200/40 dark:border-slate-700/40 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all text-xs font-bold text-slate-600 dark:text-slate-400 cursor-pointer"
            title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {darkMode ? <Sun className="w-3.5 h-3.5 text-amber-500" /> : <Moon className="w-3.5 h-3.5" />}
          </button>

          <ShellClock />
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 dark:bg-rose-950 border-b border-rose-100 dark:border-rose-900 text-rose-800 dark:text-rose-300 text-xs py-1.5 px-4 text-center font-medium flex items-center justify-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 animate-pulse" />
          <span>{error}</span>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="underline font-bold text-rose-900 dark:text-rose-200 hover:text-rose-950 flex items-center gap-0.5 ml-2"
            >
              <RefreshCw className="w-3 h-3 animate-spin" /> Reconnect
            </button>
          )}
        </div>
      )}
    </header>
  );
}

function ModuleShellInner({ children, eyebrow, error, onRetry, bleed }: ModuleShellProps) {
  const [language, setLanguage] = useState<Language>('en');
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    preloadVoices();
    const savedLang = localStorage.getItem('app_language');
    if (savedLang === 'am' || savedLang === 'om') setLanguage(savedLang);
    setDarkMode(localStorage.getItem('app_dark_mode') === 'true');
  }, []);

  const handleLang = useCallback((l: Language) => {
    setLanguage(l);
    localStorage.setItem('app_language', l);
  }, []);

  const handleDark = useCallback((d: boolean) => {
    setDarkMode(d);
    document.documentElement.classList.toggle('dark', d);
    localStorage.setItem('app_dark_mode', String(d));
  }, []);

  const content = typeof children === 'function' ? children({ language, darkMode }) : children;

  return (
    <ModuleShellCtx.Provider value={{ language, darkMode }}>
      <div className="w-screen h-screen flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
        <TopBar language={language} darkMode={darkMode} onLang={handleLang} onDark={handleDark} error={error} onRetry={onRetry} />
        <main className={`flex-1 min-h-0 overflow-auto ${bleed ? '' : 'p-4 sm:p-6'}`}>
          {content}
        </main>
      </div>
    </ModuleShellCtx.Provider>
  );
}

export const ModuleShell = memo(ModuleShellInner);
export default ModuleShell;
