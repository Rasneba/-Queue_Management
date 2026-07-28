'use client';
import dynamic from 'next/dynamic';
import ModuleShell from '@/lib/components/ModuleShell';
import usePatients from '@/lib/hooks/usePatients';

const SelfCheckInView = dynamic(() => import('@/lib/components/SelfCheckInView'), { ssr: false });

export default function CheckinPage() {
  const { patients, refresh } = usePatients();

  return (
    <ModuleShell>
      {({ language }) => (
        <SelfCheckInView onCheckInSuccess={refresh} patients={patients} language={language} />
      )}
    </ModuleShell>
  );
}
