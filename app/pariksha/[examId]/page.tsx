'use client';

import { use, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import type { ExamPhase } from '@/lib/types';
import { PreExamCountdown } from './_components/PreExamCountdown';
import { LiveExam } from './_components/LiveExam';
import { PostExam } from './_components/PostExam';

interface AttemptPayload {
  phase: ExamPhase;
  submitted?: boolean;
  server_now: number;
  start_at: string | null;
  end_at: string | null;
  remaining_seconds?: number;
  per_question_seconds?: number;
  exam: {
    title: string;
    subject: string;
    duration: number;
    total_questions: number;
    pass_score: number;
  };
  attempt?: {
    id?: string;
    answers: Record<string, number>;
    current_question_index: number;
    marked_for_review?: string[];
  };
  candidate?: {
    email: string | null;
    roll_no: string | null;
  };
  questions?: { id: string; question: string; options: string[]; image_url?: string | null }[];
  error?: string;
}

type ShellState =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'not_registered' }
  | { kind: 'ready'; data: AttemptPayload };

export default function ParikshaExamShell({ params }: { params: Promise<{ examId: string }> }) {
  const { examId } = use(params);
  const router = useRouter();
  const [state, setState] = useState<ShellState>({ kind: 'loading' });

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/exams/${examId}/attempt`, { cache: 'no-store' });
      if (res.status === 401) { router.push(`/pariksha/login?exam=${examId}`); return; }
      const data = await res.json();
      if (res.status === 403 || data?.error === 'Not registered for this exam') {
        setState({ kind: 'not_registered' });
        return;
      }
      if (!res.ok) {
        setState({ kind: 'error', message: data?.error ?? 'Failed to load exam' });
        return;
      }
      // Submitted (manual or server auto) → results.
      if (data.submitted) {
        router.replace(`/pariksha/${examId}/results`);
        return;
      }
      setState({ kind: 'ready', data });
    } catch {
      setState({ kind: 'error', message: 'Network error. Please refresh.' });
    }
  }, [examId, router]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);

  const onTimeUp = useCallback(() => {
    // Server will have auto-submitted; reload to fetch results envelope.
    void load();
  }, [load]);

  const onPhaseChange = useCallback((phase: ExamPhase) => {
    if (phase === 'pre_exam') return;
    // Re-fetch — pre_exam → live needs the question payload.
    void load();
  }, [load]);

  if (state.kind === 'loading') {
    return (
      <>
        <Header />
        <main className="grow pt-36 sm:pt-48 px-4 flex items-center justify-center bg-white">
          <div className="text-center">
            <div className="w-10 h-10 border-2 border-neutral-200 border-t-neutral-900 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-neutral-500 text-sm uppercase tracking-[0.18em]">Loading exam…</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (state.kind === 'not_registered') {
    return (
      <>
        <Header />
        <main className="grow pt-36 sm:pt-48 px-4 flex items-center justify-center bg-white">
          <div className="text-center max-w-md w-full p-8 sm:p-12 border border-neutral-200 rounded-2xl sm:rounded-3xl">
            <span className="text-[11px] uppercase tracking-[0.22em] text-neutral-500 font-medium">Locked</span>
            <h2 className="font-display text-3xl sm:text-4xl text-neutral-900 mt-3 mb-4">Not registered</h2>
            <p className="text-neutral-500 mb-6 sm:mb-8 text-sm">Complete registration and payment to take this exam.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="violet" href={`/pariksha/${examId}/register`}>Register now</Button>
              <Button variant="secondary" href="/pariksha">All exams</Button>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (state.kind === 'error') {
    return (
      <>
        <Header />
        <main className="grow pt-36 sm:pt-48 px-4 flex items-center justify-center bg-white">
          <div className="text-center max-w-md w-full p-8 sm:p-12 border border-neutral-200 rounded-2xl sm:rounded-3xl">
            <h2 className="font-display text-3xl sm:text-4xl text-neutral-900 mb-4">Something went wrong</h2>
            <p className="text-rose-500 mb-6 sm:mb-8 text-sm">{state.message}</p>
            <Button variant="primary" onClick={() => { setState({ kind: 'loading' }); void load(); }}>Retry</Button>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const { data } = state;

  if (data.phase === 'pre_exam' && data.start_at) {
    return (
      <>
        <Header />
        <PreExamCountdown
          examId={examId}
          exam={data.exam}
          startAt={data.start_at}
          endAt={data.end_at}
          serverNowMs={data.server_now}
          onPhaseChange={onPhaseChange}
        />
        <Footer />
      </>
    );
  }

  if (data.phase === 'live' && data.end_at && data.questions && data.attempt) {
    return (
      <>
        <Header />
        <LiveExam
          examId={examId}
          exam={data.exam}
          endAt={data.end_at}
          serverNowMs={data.server_now}
          perQuestionSeconds={data.per_question_seconds ?? 60}
          questions={data.questions}
          initialAnswers={data.attempt.answers ?? {}}
          initialIndex={data.attempt.current_question_index ?? 0}
          initialMarked={data.attempt.marked_for_review ?? []}
          candidate={data.candidate ?? { email: null, roll_no: null }}
          onTimeUp={onTimeUp}
        />
        <Footer />
      </>
    );
  }

  // post_exam fallback — go straight to results.
  return (
    <>
      <Header />
      <PostExam examId={examId} />
      <Footer />
    </>
  );
}
