'use client';
import dynamic from 'next/dynamic';
import ModuleShell from '@/lib/components/ModuleShell';
import usePatients from '@/lib/hooks/usePatients';

const DoctorDashboard = dynamic(() => import('@/lib/components/DoctorDashboard'), { ssr: false });

export default function DoctorPage() {
  const { patients, error, refresh } = usePatients();

  const handleReset = async () => {
    if (!window.confirm("Reset the queue database?")) return;
    try {
      const res = await fetch('/api/reset', { method: 'POST' });
      if (!res.ok) throw new Error('Reset failed');
      window.location.reload();
    } catch { alert('Reset failed'); }
  };

  return (
    <ModuleShell error={error} onRetry={refresh}>
      {({ language }) => (
        <DoctorDashboard patients={patients} onUpdatePatients={refresh} onResetDatabase={handleReset} />
      )}
    </ModuleShell>
  );
}
