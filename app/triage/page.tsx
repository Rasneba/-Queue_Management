'use client';
import usePatients from '@/lib/hooks/usePatients';
import dynamic from 'next/dynamic';

const KioskView = dynamic(() => import('@/lib/components/KioskView'), { ssr: false });

export default function TriagePage() {
  const { patients, refresh } = usePatients();

  const handleSuccess = (newPatient: import('@/lib/types').Patient) => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-900">
      <KioskView onCheckInSuccess={handleSuccess} patients={patients} language="en" />
    </div>
  );
}
