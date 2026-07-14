'use client';
import usePatients from '@/lib/hooks/usePatients';
import dynamic from 'next/dynamic';

const DoctorDashboard = dynamic(() => import('@/lib/components/DoctorDashboard'), { ssr: false });

export default function DoctorPage() {
  const { patients, refresh } = usePatients();

  const handleReset = async () => {
    if (!window.confirm("Reset the queue database?")) return;
    try {
      const res = await fetch('/api/reset', { method: 'POST' });
      if (!res.ok) throw new Error('Reset failed');
      const data = await res.json();
      window.location.reload();
    } catch { alert('Reset failed'); }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <DoctorDashboard patients={patients} onUpdatePatients={refresh} onResetDatabase={handleReset} />
    </div>
  );
}
