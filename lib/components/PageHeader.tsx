'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Heart, Tv, Stethoscope, BarChart2, BarChart3,
  UserCheck, Ticket, Globe, Moon, Sun, Home,
  CheckCircle2, AlertCircle, RefreshCw
} from 'lucide-react';
import { Language, t } from '@/lib/utils/translations';
import LiveClock from '@/lib/components/Clock';

interface PageHeaderProps {
  language?: Language;
  onLanguageChange?: (lang: Language) => void;
  darkMode?: boolean;
  onDarkModeToggle?: (dark: boolean) => void;
  error?: string | null;
  onRetry?: () => void;
  notification?: string | null;
}

const NAV_ITEMS = [
  { href: '/', labelKey: 'home', icon: Home, color: 'slate' },
  { href: '/checkin', labelKey: 'tabSelfCheckIn', icon: UserCheck, color: 'emerald' },
  { href: '/triage', labelKey: 'tabTriageKiosk', icon: CheckCircle2, color: 'blue' },
  { href: '/board', labelKey: 'tabWaitingBoard', icon: Tv, color: 'blue' },
  { href: '/doctor', labelKey: 'tabStaffConsole', icon: Stethoscope, color: 'blue' },
  { href: '/reception', labelKey: 'tabReceptionDesk', icon: Ticket, color: 'blue' },
  { href: '/analytics', labelKey: 'tabAnalytics', icon: BarChart2, color: 'blue' },
  { href: '/reports', labelKey: 'reports', icon: BarChart3, color: 'blue' },
] as const;

const HOME_TRANSLATIONS = {
  en: 'Home',
  am: 'መነሻ',
  om: 'Mana',
};

const ACTIVE_COLORS: Record<string, string> = {
  slate: 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm border border-slate-200 dark:border-slate-600',
  emerald: 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-400 shadow-sm border border-emerald-100 dark:border-emerald-900',
  blue: 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-400 shadow-sm border border-blue-100 dark:border-blue-900',
};

export default function PageHeader({
  language = 'en',
  onLanguageChange,
  darkMode = false,
  onDarkModeToggle,
  error,
  onRetry,
  notification,
}: PageHeaderProps) {
  const pathname = usePathname();
  const [lang, setLang] = useState<Language>(language);
  const [dark, setDark] = useState(darkMode);

  useEffect(() => {
    setLang(language);
  }, [language]);

  useEffect(() => {
    setDark(darkMode);
  }, [darkMode]);

  const handleLangChange = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem('app_language', newLang);
    onLanguageChange?.(newLang);
  };

  const handleDarkToggle = () => {
    const newDark = !dark;
    setDark(newDark);
    document.documentElement.classList.toggle('dark', newDark);
    localStorage.setItem('app_dark_mode', String(newDark));
    onDarkModeToggle?.(newDark);
  };

  const getNavLabel = (labelKey: string) => {
    if (labelKey === 'home') return HOME_TRANSLATIONS[lang];
    if (labelKey === 'reports') return 'Reports';
    return t(labelKey as any, lang);
  };

  return (
    <>
      {notification && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 border border-slate-800 text-blue-300 py-3 px-6 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-semibold animate-fade-up">
          <CheckCircle2 className="w-4 h-4 text-blue-400" />
          <span>{notification}</span>
        </div>
      )}

      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 transition-all shadow-[0_2px_15px_rgba(0,0,0,0.015)]">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3 shrink-0">
              <img src="/lancetlogo.png" alt="Lancet General Hospital" className="h-10 w-auto object-contain" />
              <div className="h-10 w-[1px] bg-slate-200 dark:bg-slate-700 hidden sm:block"></div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-extrabold tracking-tight text-slate-800 dark:text-slate-100 font-sans leading-tight">
                  {t('hospitalName', lang)}
                </h1>
                <p className="text-[9px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-[0.15em]">
                  {t('aiTriageHub', lang)}
                </p>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-3 flex-wrap justify-center">
            <nav className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/50 dark:border-slate-700/50 overflow-x-auto">
              {NAV_ITEMS.map(({ href, labelKey, icon: Icon, color }) => {
                const isActive = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold tracking-wide transition-all whitespace-nowrap ${
                      isActive
                    ? ACTIVE_COLORS[color]
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive && color === 'emerald' ? 'text-emerald-600 dark:text-emerald-400' : isActive && color === 'blue' ? 'text-blue-600 dark:text-blue-400' : ''}`} />
                    <span className="hidden lg:inline">{getNavLabel(labelKey)}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200/40 dark:border-slate-700/40">
                <Globe className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <select
                  value={lang}
                  onChange={(e) => handleLangChange(e.target.value as Language)}
                  className="bg-transparent border-none text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer pr-1 outline-none"
                >
                  <option value="en">EN</option>
                  <option value="am">AM</option>
                  <option value="om">OM</option>
                </select>
              </div>
              <button
                type="button"
                onClick={handleDarkToggle}
                className="flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-xl border border-slate-200/40 dark:border-slate-700/40 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all text-xs font-bold text-slate-600 dark:text-slate-400 cursor-pointer"
                title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {dark ? <Sun className="w-3.5 h-3.5 text-amber-500" /> : <Moon className="w-3.5 h-3.5" />}
              </button>
            </div>

              <div className="hidden md:flex items-center gap-3 text-right">
                <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-700"></div>
                <LiveClock
                  timeClassName="text-xl font-black tabular-nums text-slate-800 dark:text-slate-100 leading-none"
                  dateClassName="text-[9px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mt-0.5"
                />
              </div>
          </div>
        </div>
      </header>

      {error && (
        <div className="bg-rose-50 dark:bg-rose-950 border-b border-rose-100 dark:border-rose-900 text-rose-800 dark:text-rose-300 text-xs py-2 px-4 text-center font-medium flex items-center justify-center gap-2">
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
    </>
  );
}
