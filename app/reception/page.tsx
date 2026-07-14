'use client';
import usePatients from '@/lib/hooks/usePatients';
import dynamic from 'next/dynamic';

const ReceptionConsole = dynamic(() => import('@/lib/components/ReceptionConsole'), { ssr: false });

export default function ReceptionPage() {
  const { patients, error, refresh } = usePatients();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <ReceptionConsole patients={patients} onUpdatePatients={refresh} isOffline={!!error} />
    </div>
  );
}
