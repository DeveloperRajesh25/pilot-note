'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { useToast } from '@/components/ui/Toast';
import { computeDrift, remainingSeconds, formatCountdown } from '@/lib/time';
import { useExamProctoring, requestExamFullscreen } from '../useExamProctoring';

interface Question {
  id: string;
  question: string;
  options: string[];
  image_url?: string | null;
}

interface ExamMeta {
  title: string;
  subject: string;
  duration: number;
  total_questions: number;
  pass_score: number;
}

interface Props {
  examId: string;
  exam: ExamMeta;
  endAt: string;                // ISO
  serverNowMs: number;
  perQuestionSeconds: number;
  questions: Question[];
  initialAnswers: Record<string, number>;
  initialIndex: number;
  /** Called when the global clock crosses end_at locally; shell will flip to post-exam. */
  onTimeUp: () => void;
}

type ExitStep = 'closed' | 'first' | 'second';

export function LiveExam({
  examId,
  exam,
  endAt,
  serverNowMs,
  perQuestionSeconds,
  questions,
  initialAnswers,
  initialIndex,
  onTimeUp,
}: Props) {
  const router = useRouter();
  const toast = useToast();

  const driftRef = useRef(computeDrift(serverNowMs));
  const endMs = useMemo(() => new Date(endAt).getTime(), [endAt]);

  const [answers, setAnswers] = useState<Record<string, number>>(initialAnswers);
  const [currentIndex, setCurrentIndex] = useState(Math.min(initialIndex, Math.max(0, questions.length - 1)));
  const [remaining, setRemaining] = useState(remainingSeconds(endMs, driftRef.current));
  const [perQuestionLeft, setPerQuestionLeft] = useState(perQuestionSeconds);
  const [submitting, setSubmitting] = useState(false);
  const [exitStep, setExitStep] = useState<ExitStep>('closed');
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  // Keep the latest answers/index inside refs so heartbeat closures stay current.
  const answersRef = useRef(answers);
  const indexRef = useRef(currentIndex);
  answersRef.current = answers;
  indexRef.current = currentIndex;

  // Proctoring — warn the user via toast, log to DB.
  useExamProctoring(examId, {
    onViolation: (v) => toast.warn(v.message),
  });

  // Request fullscreen once on mount via a user-gesture-friendly click handler.
  const [fullscreenAsked, setFullscreenAsked] = useState(false);
  const askFullscreen = useCallback(async () => {
    setFullscreenAsked(true);
    await requestExamFullscreen();
  }, []);

  // Global countdown — drift-corrected, runs every second.
  useEffect(() => {
    const tick = () => {
      const left = remainingSeconds(endMs, driftRef.current);
      setRemaining(left);
      if (left <= 0) onTimeUp();
    };
    tick();
    const i = setInterval(tick, 1000);
    return () => clearInterval(i);
  }, [endMs, onTimeUp]);

  // Per-question timer — soft auto-advance. Resets when the user moves.
  useEffect(() => {
    setPerQuestionLeft(perQuestionSeconds);
    if (questions.length === 0) return;
    const i = setInterval(() => {
      setPerQuestionLeft((prev) => {
        if (prev <= 1) {
          // Auto-advance unless we're on the last question.
          setCurrentIndex((idx) => (idx < questions.length - 1 ? idx + 1 : idx));
          return perQuestionSeconds;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(i);
  }, [currentIndex, perQuestionSeconds, questions.length]);

  // Heartbeat every 30s — persists answers + current_question_index, refreshes drift.
  useEffect(() => {
    let cancelled = false;
    const beat = async () => {
      try {
        const res = await fetch(`/api/exams/${examId}/heartbeat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            answers: answersRef.current,
            current_question_index: indexRef.current,
          }),
        });
        if (!res.ok) return;
        const data: { server_now?: number; phase?: string } = await res.json();
        if (cancelled) return;
        if (typeof data.server_now === 'number') {
          driftRef.current = computeDrift(data.server_now);
        }
        if (data.phase === 'post_exam') onTimeUp();
      } catch {
        // ignore transient failures
      }
    };
    const i = setInterval(beat, 30_000);
    return () => { cancelled = true; clearInterval(i); };
  }, [examId, onTimeUp]);

  // Persist answer change immediately (fire-and-forget heartbeat).
  const recordAnswer = useCallback((qId: string, optIndex: number) => {
    setAnswers((prev) => {
      const next = { ...prev, [qId]: optIndex };
      fetch(`/api/exams/${examId}/heartbeat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: next, current_question_index: indexRef.current }),
        keepalive: true,
      }).catch(() => {});
      return next;
    });
  }, [examId]);

  // Block back/refresh: requires user-friendly leave flow via the dialog.
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/exams/${examId}/attempt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: answersRef.current }),
      });
      const data = await res.json();
      if (res.ok || data?.message === 'Already submitted') {
        router.replace(`/pariksha/${examId}/results`);
      } else {
        toast.error(data?.error ?? 'Submission failed');
      }
    } catch {
      toast.error('Network error — please try again');
    } finally {
      setSubmitting(false);
    }
  }, [examId, router, submitting, toast]);

  const confirmSubmit = useCallback(() => {
    setShowSubmitConfirm(true);
  }, []);

  const currentQ = questions[currentIndex];
  const currentQText = currentQ?.question?.trim() ?? '';
  const currentQOptions = Array.isArray(currentQ?.options)
    ? currentQ.options.map((o) => (typeof o === 'string' ? o : ''))
    : [];
  const hasOptions = currentQOptions.some((o) => o.trim().length > 0);
  const questionIncomplete = !!currentQ && (!currentQText || !hasOptions);
  const answeredCount = Object.keys(answers).length;
  const lowTime = remaining < 300;
  const lowQTime = perQuestionLeft <= 10;

  return (
    <main className="grow pt-24 bg-white min-h-screen">
      {/* Fullscreen / consent gate. Shows once until the user acknowledges. */}
      {!fullscreenAsked && (
        <div className="fixed inset-0 z-150 bg-white/95 backdrop-blur-md flex items-center justify-center p-6">
          <div className="max-w-lg w-full border border-neutral-200 rounded-3xl p-8 md:p-10 bg-white">
            <span className="text-[11px] uppercase tracking-[0.22em] text-neutral-500 font-medium">Ready to begin</span>
            <h2 className="font-display text-3xl md:text-4xl text-neutral-900 mt-3 mb-4 tracking-tight">
              Enter fullscreen to start
            </h2>
            <p className="text-neutral-600 text-sm leading-relaxed mb-6">
              The exam runs in fullscreen. Switching tabs, exiting fullscreen, right-clicks, or
              copy/paste attempts are logged and visible to administrators. False positives may
              occur — keep the exam window focused.
            </p>
            <Button variant="violet" size="lg" onClick={askFullscreen}>
              Start exam
            </Button>
          </div>
        </div>
      )}

      {/* Top bar */}
      <div className="sticky top-20 bg-white/90 backdrop-blur-xl border-b border-neutral-200 z-40 px-6 py-4">
        <div className="container mx-auto flex justify-between items-center gap-4">
          <div className="min-w-0">
            <h1 className="font-display text-xl text-neutral-900 tracking-tight truncate">{exam.title}</h1>
            <span className="text-[11px] uppercase tracking-[0.22em] text-neutral-500 font-medium">{exam.subject}</span>
          </div>
          <div className="flex items-center gap-6 shrink-0">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-[9px] uppercase tracking-[0.22em] text-neutral-400 font-medium">This question</span>
              <span className={`font-mono text-sm tabular-nums ${lowQTime ? 'text-rose-600' : 'text-neutral-700'}`}>
                {perQuestionLeft.toString().padStart(2, '0')}s
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[9px] uppercase tracking-[0.22em] text-neutral-400 font-medium">Time remaining</span>
              <span className={`font-mono text-lg tabular-nums ${lowTime ? 'text-rose-600 animate-pulse' : 'text-neutral-900'}`}>
                {formatCountdown(remaining)}
              </span>
            </div>
            <button
              onClick={() => setExitStep('first')}
              className="text-xs font-medium text-neutral-500 hover:text-rose-600 transition-colors uppercase tracking-[0.18em]"
            >
              Exit
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-10">
        <div className="text-[11px] text-neutral-500 leading-relaxed mb-6">
          Tab switches, fullscreen exits, copy attempts, and developer-tool shortcuts are logged and visible to administrators.
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Question panel */}
          <div className="grow min-w-0">
            <div className="border border-neutral-200 rounded-3xl p-8 md:p-12">
              <div className="flex justify-between items-center mb-8">
                <span className="text-[11px] uppercase tracking-[0.22em] text-neutral-500 font-medium">
                  Question {currentIndex + 1} of {questions.length}
                </span>
                <span className="px-3 py-1 bg-neutral-100 text-neutral-700 text-[10px] uppercase tracking-[0.18em] rounded-full font-medium">
                  1 mark
                </span>
              </div>

              <div className="mb-10">
                <div className="h-px bg-neutral-200 overflow-hidden">
                  <div
                    className="h-full bg-neutral-900 transition-all duration-500"
                    style={{ width: `${((currentIndex + 1) / Math.max(1, questions.length)) * 100}%` }}
                  />
                </div>
              </div>

              {questionIncomplete ? (
                <div className="mb-12 border border-amber-200 bg-amber-50 rounded-2xl p-6">
                  <p className="text-amber-800 font-bold text-sm mb-1">This question is missing content.</p>
                  <p className="text-amber-700 text-sm">
                    The administrator hasn&apos;t finished setting it up. Skip ahead — you won&apos;t be marked
                    wrong for not answering it.
                  </p>
                </div>
              ) : (
                <>
                  {currentQ?.image_url && (
                    <div className="mb-8">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={currentQ.image_url}
                        alt="Question diagram"
                        className="max-w-full max-h-72 rounded-2xl border border-neutral-200 object-contain"
                      />
                    </div>
                  )}
                  <h2 className="font-display text-2xl md:text-3xl text-neutral-900 mb-10 leading-tight tracking-tight">
                    {currentQText}
                  </h2>

                  <div className="space-y-3 mb-12">
                    {currentQOptions.map((opt, i) => {
                      const trimmed = opt.trim();
                      if (!trimmed) return null;
                      const selected = answers[currentQ!.id] === i;
                      return (
                        <button
                          key={i}
                          onClick={() => recordAnswer(currentQ!.id, i)}
                          className={`group w-full flex items-center gap-5 p-5 rounded-2xl border transition-all text-left ${
                            selected ? 'border-neutral-900 bg-neutral-50' : 'border-neutral-200 bg-white hover:border-neutral-900'
                          }`}
                        >
                          <span className={`w-9 h-9 shrink-0 flex items-center justify-center rounded-lg font-medium text-sm transition-colors ${
                            selected ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-500'
                          }`}>
                            {String.fromCharCode(65 + i)}
                          </span>
                          <span className={`text-[15px] font-medium ${selected ? 'text-neutral-900' : 'text-neutral-700'}`}>
                            {trimmed}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              <div className="flex justify-between items-center pt-8 border-t border-neutral-200">
                <Button
                  variant="secondary"
                  onClick={() => setCurrentIndex((p) => Math.max(0, p - 1))}
                  disabled={currentIndex === 0}
                >
                  ← Previous
                </Button>
                {currentIndex < questions.length - 1 ? (
                  <Button
                    variant="primary"
                    onClick={() => { setCurrentIndex((p) => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  >
                    Next →
                  </Button>
                ) : (
                  <Button variant="violet" onClick={confirmSubmit} disabled={submitting}>
                    {submitting ? 'Submitting…' : 'Submit exam'}
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar palette */}
          <aside className="w-full lg:w-72 shrink-0">
            <div className="border border-neutral-200 rounded-3xl p-6 lg:sticky lg:top-44">
              <h3 className="text-[11px] uppercase tracking-[0.22em] text-neutral-500 font-medium flex items-center gap-2 mb-4">
                <span className="w-6 h-px bg-neutral-900" /> Palette
              </h3>
              <p className="text-xs text-neutral-400 mb-6 font-mono">{answeredCount} / {questions.length} answered</p>
              <div className="grid grid-cols-5 gap-2 mb-6">
                {questions.map((q, i) => (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(i)}
                    className={`w-10 h-10 rounded-lg border text-xs font-medium flex items-center justify-center transition-all hover:scale-105 ${
                      i === currentIndex ? 'bg-neutral-900 border-neutral-900 text-white' :
                      answers[q.id] !== undefined ? 'bg-emerald-500 border-emerald-500 text-white' :
                      'bg-neutral-50 text-neutral-400 border-neutral-200'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <div className="space-y-2 mb-6 text-[10px] uppercase tracking-[0.18em] text-neutral-500">
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-sm bg-emerald-500" /> Answered</div>
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-sm bg-neutral-900" /> Current</div>
              </div>
              <Button variant="violet" className="w-full" onClick={confirmSubmit} disabled={submitting}>
                {submitting ? 'Submitting…' : 'Submit exam'}
              </Button>
            </div>
          </aside>
        </div>
      </div>

      {/* Submit confirmation */}
      <Dialog
        open={showSubmitConfirm}
        title="Submit your answers?"
        description={
          <>
            You&apos;ve answered <strong>{answeredCount}</strong> of <strong>{questions.length}</strong> questions.
            Once submitted you cannot change them.
          </>
        }
        confirmLabel="Submit"
        cancelLabel="Keep working"
        onCancel={() => setShowSubmitConfirm(false)}
        onConfirm={() => { setShowSubmitConfirm(false); void handleSubmit(); }}
        busy={submitting}
      />

      {/* Exit flow — two-step confirmation */}
      <Dialog
        open={exitStep === 'first'}
        title="Leave the exam?"
        description="The exam clock keeps running while you're away. You can re-enter before time is up, but seconds spent outside cannot be reclaimed."
        confirmLabel="Continue"
        cancelLabel="Stay"
        onCancel={() => setExitStep('closed')}
        onConfirm={() => setExitStep('second')}
      />
      <Dialog
        open={exitStep === 'second'}
        title="Are you sure?"
        description={
          <>
            Your answers so far are saved. The exam ends globally at {' '}
            <strong>{new Date(endAt).toLocaleTimeString('en-IN')}</strong>{' '}
            regardless of whether you&apos;re here. Leaving now is final until you re-open this page.
          </>
        }
        confirmLabel="Leave anyway"
        cancelLabel="Stay"
        confirmTone="danger"
        onCancel={() => setExitStep('closed')}
        onConfirm={() => {
          setExitStep('closed');
          // Best-effort exit fullscreen then navigate.
          if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
          router.push('/pariksha');
        }}
      />
    </main>
  );
}
