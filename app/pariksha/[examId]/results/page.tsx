'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { ArrowRight, Loader2 } from 'lucide-react';

interface ResultPayload {
  phase: 'pre_exam' | 'live' | 'post_exam';
  submitted?: boolean;
  score?: number;
  total?: number;
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
            <p className="text-neutral-500 mt-4 text-sm uppercase tracking-[0.18em]">Loading your result…</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const score = data.score ?? 0;
  const total = data.total ?? 0;
  const pct = total > 0 ? Math.round((score / total) * 100) : 0;
  const passThreshold = data.exam.pass_score ?? 40;
  const passed = pct >= passThreshold;
  const tone = passed ? 'text-emerald-600' : 'text-rose-500';
  const verdictLine = passed
    ? 'You passed. Take a moment to celebrate.'
    : `You needed ${passThreshold}% to pass.`;

  return (
    <>
      <Header />
      <main className="grow pt-28 sm:pt-36 pb-16 sm:pb-24 bg-white">
        <div className="container mx-auto px-4 sm:px-6 max-w-3xl">
          <span className="text-[11px] uppercase tracking-[0.22em] text-neutral-500 font-medium flex items-center gap-2 mb-5">
            <span className="w-6 h-px bg-neutral-900" /> Result · {data.exam.subject}
          </span>

          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl text-neutral-900 leading-[1.05] tracking-[-0.03em] mb-3">
            {data.exam.title}
          </h1>
          <p className="text-neutral-600 text-sm sm:text-base mb-8 sm:mb-12">
            {data.auto_submitted ? 'Auto-submitted at the exam end time.' : 'Submitted by you.'}
          </p>

          <div className="border border-neutral-200 rounded-3xl p-6 sm:p-10 md:p-16 text-center mb-6 sm:mb-10">
            <div className="relative w-36 h-36 sm:w-44 sm:h-44 mx-auto mb-6">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="88" cy="88" r="72" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-neutral-100" />
                <circle
                  cx="88" cy="88" r="72"
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="transparent"
                  strokeDasharray={2 * Math.PI * 72}
                  strokeDashoffset={(2 * Math.PI * 72) * (1 - pct / 100)}
                  strokeLinecap="round"
                  className={`transition-all duration-1000 ${passed ? 'text-emerald-500' : 'text-rose-500'}`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display text-4xl sm:text-5xl text-neutral-900 leading-none tabular-nums">{pct}%</span>
                <span className="text-[10px] uppercase tracking-[0.22em] text-neutral-400 mt-2">{score}/{total}</span>
              </div>
            </div>

            <p className={`font-display text-2xl sm:text-3xl mb-1 ${tone}`}>
              {passed ? 'Pass' : 'Fail'}
            </p>
            <p className="text-neutral-500 text-sm mb-6 sm:mb-8">{verdictLine}</p>

            <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 justify-center flex-wrap">
              <Button variant="primary" href={`/pariksha/${examId}/answers`}>View answers <ArrowRight className="w-4 h-4" /></Button>
              <Button variant="secondary" href="/pariksha">All exams</Button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5 sm:gap-4 text-center">
            <Stat label="Pass threshold" value={`${passThreshold}%`} />
            <Stat label="Your score" value={`${score}/${total}`} />
            <Stat label="Percentage" value={`${pct}%`} tone={passed ? 'emerald' : 'rose'} />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'emerald' | 'rose' }) {
  const color = tone === 'emerald' ? 'text-emerald-600' : tone === 'rose' ? 'text-rose-500' : 'text-neutral-900';
  return (
    <div className="border border-neutral-200 rounded-2xl p-3 sm:p-6">
      <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.18em] sm:tracking-[0.22em] text-neutral-400 mb-1.5 sm:mb-2 font-medium">{label}</p>
      <p className={`font-display text-lg sm:text-2xl tracking-tight ${color}`}>{value}</p>
    </div>
  );
}
