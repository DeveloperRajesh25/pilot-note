'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { DgcaResultReview, type DgcaReviewQuestion } from '../../_components/DgcaResultReview';

interface ResultPayload {
  result: { id: string; chapter_id: string; score: number; total: number; answers: (number | null)[]; completed_at: string };
  chapter: { id: string; title: string; dgca_subjects?: { name: string } | null } | null;
  questions: DgcaReviewQuestion[];
}

export default function DgcaResultReviewPage({ params }: { params: Promise<{ resultId: string }> }) {
  const { resultId } = use(params);
  const router = useRouter();
  const [data, setData] = useState<ResultPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Same content protection as the practice flow — block copy/selection/devtools.
  useEffect(() => {
    const block = (e: Event) => e.preventDefault();
    const onKeyDown = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;
      const k = e.key.toLowerCase();
      if (e.key === 'F12') { e.preventDefault(); return; }
      if (ctrl && e.shiftKey && (k === 'i' || k === 'j' || k === 'c')) { e.preventDefault(); return; }
      if (ctrl && (k === 'c' || k === 'x' || k === 'a' || k === 's' || k === 'p' || k === 'u')) e.preventDefault();
    };
    const events: [string, EventListener][] = [
      ['contextmenu', block], ['copy', block], ['cut', block], ['paste', block],
      ['dragstart', block], ['selectstart', block], ['keydown', onKeyDown as EventListener],
    ];
    events.forEach(([type, fn]) => document.addEventListener(type, fn));
    return () => events.forEach(([type, fn]) => document.removeEventListener(type, fn));
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch(`/api/dgca/results/${resultId}`, { cache: 'no-store' });
      if (res.status === 401) { router.push(`/login?redirect=${encodeURIComponent('/profile')}`); return; }
      const d = await res.json();
      if (cancelled) return;
      if (!res.ok) { setError(d?.error ?? 'Failed to load result'); return; }
      setData(d);
    })();
    return () => { cancelled = true; };
  }, [resultId, router]);

  if (error) {
    return (
      <>
        <Header />
        <main className="grow pt-40 sm:pt-48 flex items-center justify-center bg-white px-4">
          <div className="text-center max-w-md p-8 sm:p-12 border border-neutral-200 rounded-3xl">
            <h2 className="font-display text-3xl sm:text-4xl text-neutral-900 mb-4">Result unavailable</h2>
            <p className="text-rose-600 mb-8 text-sm">{error}</p>
            <Button variant="primary" href="/profile">Back to profile</Button>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!data) {
    return (
      <>
        <Header />
        <main className="grow pt-48 flex items-center justify-center bg-white">
          <div className="text-center">
            <Loader2 className="w-8 h-8 mx-auto text-neutral-400 animate-spin" />
            <p className="text-neutral-500 mt-4 text-sm uppercase tracking-[0.18em]">Loading result…</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="grow pt-28 sm:pt-32 lg:pt-36 pb-16 sm:pb-24 bg-white min-h-screen exam-lockdown">
        <div className="container mx-auto px-4 sm:px-6">
          <button
            onClick={() => router.push('/profile')}
            className="group inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-900 mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" /> Back to profile
          </button>

          <DgcaResultReview
            chapterTitle={data.chapter?.title ?? 'DGCA practice'}
            subjectName={data.chapter?.dgca_subjects?.name ?? null}
            questions={data.questions}
            answers={data.result.answers ?? []}
          />

          <div className="max-w-3xl mx-auto mt-10 sm:mt-12 flex flex-col sm:flex-row gap-3">
            <Button variant="primary" size="lg" href="/dgca" className="justify-center">Practice more chapters</Button>
            <Button variant="secondary" size="lg" href="/profile" className="justify-center">Back to profile</Button>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
