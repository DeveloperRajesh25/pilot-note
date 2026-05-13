'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function PostExam({ examId }: { examId: string }) {
  const router = useRouter();
  useEffect(() => {
    router.replace(`/pariksha/${examId}/results`);
  }, [examId, router]);

  return (
    <main className="grow pt-48 flex items-center justify-center bg-white">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-neutral-200 border-t-neutral-900 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-neutral-500 text-sm uppercase tracking-[0.18em]">Loading your result…</p>
      </div>
    </main>
  );
}
