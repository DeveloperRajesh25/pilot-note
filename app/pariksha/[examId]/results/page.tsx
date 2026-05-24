'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';

interface ResultPayload {
  phase: 'pre_exam' | 'live' | 'post_exam';
  submitted?: boolean;
  auto_submitted?: boolean;
  start_at?: string | null;
  end_at?: string | null;
  exam: {
    title: string;
    subject: string;
    pass_score: number;
  };
}

export default function ParikshaResultsPage({ params }: { params: Promise<{ examId: string }> }) {
  const { examId } = use(params);
  const router = useRouter();
  const [data, setData] = useState<ResultPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch(`/api/exams/${examId}/attempt`, { cache: 'no-store' });
      if (res.status === 401) { router.push(`/pariksha/login?exam=${examId}`); return; }
      const payload = await res.json();
      if (cancelled) return;
      if (!res.ok) { setError(payload?.error ?? 'Failed to load result'); return; }
      if (!payload.submitted) {
        // Exam may still be live; bounce back to the exam page.
        router.replace(`/pariksha/${examId}`);
        return;
      }
      setData(payload);
    })();
    return () => { cancelled = true; };
  }, [examId, router]);

  if (error) {
    return (
      <>
        <Header />
        <main className="grow pt-48 flex items-center justify-center bg-white">
          <div className="text-center max-w-md p-12 border border-neutral-200 rounded-3xl">
            <h2 className="font-display text-4xl text-neutral-900 mb-4">Result unavailable</h2>
            <p className="text-rose-500 mb-8 text-sm">{error}</p>
            <Button variant="primary" href="/pariksha">Back to exams</Button>
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
            <p className="text-neutral-500 mt-4 text-sm uppercase tracking-[0.18em]">Loading…</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="grow pt-28 sm:pt-36 pb-16 sm:pb-24 bg-white">
        <div className="container mx-auto px-4 sm:px-6 max-w-3xl">
          <span className="text-[11px] uppercase tracking-[0.22em] text-neutral-500 font-medium flex items-center gap-2 mb-5">
            <span className="w-6 h-px bg-neutral-900" /> Submitted · {data.exam.subject}
          </span>

          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl text-neutral-900 leading-[1.05] tracking-[-0.03em] mb-3">
            {data.exam.title}
          </h1>
          <p className="text-neutral-600 text-sm sm:text-base mb-8 sm:mb-12">
            {data.auto_submitted ? 'Auto-submitted at the exam end time.' : 'Submitted by you.'}
          </p>

          <div className="border border-neutral-200 rounded-3xl p-6 sm:p-10 md:p-14 text-center mb-6 sm:mb-10">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-6 sm:mb-8 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-600" strokeWidth={1.5} />
            </div>

            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl text-neutral-900 mb-3 tracking-tight">
              Your answers have been recorded
            </h2>
            <p className="text-neutral-600 text-sm sm:text-base leading-relaxed max-w-xl mx-auto mb-8 sm:mb-10">
              Marks and the All-India rank will be announced shortly. You&apos;ll receive an
              email with the date and time as soon as the result schedule is confirmed.
              You can review the answer key below in the meantime.
            </p>

            <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 justify-center flex-wrap">
              <Button variant="primary" href={`/pariksha/${examId}/answers`}>
                View answers <ArrowRight className="w-4 h-4" />
              </Button>
              <Button variant="secondary" href="/pariksha">All exams</Button>
            </div>
          </div>

          <div className="border border-neutral-200 rounded-2xl p-5 sm:p-6 bg-neutral-50">
            <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.22em] text-neutral-500 font-medium mb-2">
              What happens next
            </p>
            <ul className="text-sm text-neutral-700 leading-relaxed space-y-1.5">
              <li>· Answer key is available now — open it from the button above.</li>
              <li>· Individual marks are being verified and will be released together.</li>
              <li>· All-India rank requires every candidate&apos;s attempt to be processed first.</li>
              <li>· You&apos;ll be notified by email when results go live.</li>
            </ul>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
