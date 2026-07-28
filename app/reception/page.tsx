'use client';
import dynamic from 'next/dynamic';
import ModuleShell from '@/lib/components/ModuleShell';
import useActivePatients from '@/lib/hooks/useActivePatients';

const ReceptionConsole = dynamic(() => import('@/lib/components/ReceptionConsole'), { ssr: false });

export default function ReceptionPage() {
  const { patients, error, refresh } = useActivePatients();

  return (
    <ModuleShell error={error} onRetry={refresh}>
      {({ language }) => (
        <ReceptionConsole patients={patients} onUpdatePatients={refresh} language={language} isOffline={!!error} />
      )}
    </ModuleShell>
  );
}
