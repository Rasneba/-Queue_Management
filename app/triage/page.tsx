'use client';
import dynamic from 'next/dynamic';
import ModuleShell from '@/lib/components/ModuleShell';
import usePatients from '@/lib/hooks/usePatients';

const KioskView = dynamic(() => import('@/lib/components/KioskView'), { ssr: false });

export default function TriagePage() {
  const { patients, error, refresh } = usePatients();

  return (
    <ModuleShell error={error} onRetry={refresh}>
      {({ language }) => (
        <KioskView onCheckInSuccess={refresh} patients={patients} language={language} />
      )}
    </ModuleShell>
  );
}
