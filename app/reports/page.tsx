'use client';
import dynamic from 'next/dynamic';
import ModuleShell from '@/lib/components/ModuleShell';

const Reports = dynamic(() => import('@/lib/components/Reports'), { ssr: false });

export default function ReportsPage() {
  return (
    <ModuleShell>
      <Reports />
    </ModuleShell>
  );
}
