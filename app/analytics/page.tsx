'use client';
import usePatients from '@/lib/hooks/usePatients';
import dynamic from 'next/dynamic';

const AnalyticsView = dynamic(() => import('@/lib/components/AnalyticsView'), { ssr: false });

export default function AnalyticsPage() {
  const { patients } = usePatients();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
      <AnalyticsView patients={patients} />
    </div>
  );
}
