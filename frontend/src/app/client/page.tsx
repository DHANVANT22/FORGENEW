'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ClientIndexPage() {
  const router = useRouter();

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('clientToken') : null;
    if (token) {
      router.replace('/client/dashboard');
    } else {
      router.replace('/client/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center text-white font-mono text-xs">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-[#5CA8C9] animate-ping" />
        <span className="text-[#82C4DE]">Routing to Client Gateway...</span>
      </div>
    </div>
  );
}
