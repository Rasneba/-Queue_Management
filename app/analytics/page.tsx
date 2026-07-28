'use client';
import dynamic from 'next/dynamic';
import ModuleShell from '@/lib/components/ModuleShell';
import usePatients from '@/lib/hooks/usePatients';

const AnalyticsView = dynamic(() => import('@/lib/components/AnalyticsView'), { ssr: false });

export default function AnalyticsPage() {
  const { patients, error, refresh } = usePatients();

  return (
    <ModuleShell error={error} onRetry={refresh}>
      {({ language }) => (
        <AnalyticsView patients={patients} />
      )}
    </ModuleShell>
  );
}
