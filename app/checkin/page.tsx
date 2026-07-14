'use client';
import usePatients from '@/lib/hooks/usePatients';
import dynamic from 'next/dynamic';

const SelfCheckInView = dynamic(() => import('@/lib/components/SelfCheckInView'), { ssr: false });

export default function CheckinPage() {
  const { patients, refresh } = usePatients();

  const handleSuccess = (newPatient: import('@/lib/types').Patient) => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-900">
      <SelfCheckInView onCheckInSuccess={handleSuccess} patients={patients} language="en" />
    </div>
  );
}
