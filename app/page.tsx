'use client';

import dynamic from 'next/dynamic';

const HomeClient = dynamic(() => import('./home-client'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
      <div className="text-slate-400 text-sm font-semibold">Loading Lancet General Hospital...</div>
    </div>
  ),
});

export default function Home() {
  return <HomeClient />;
}
