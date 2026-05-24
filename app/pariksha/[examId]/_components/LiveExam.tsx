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

interface Candidate {
  email: string | null;
  roll_no: string | null;
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
  initialMarked: string[];
  candidate: Candidate;
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
  initialMarked,
  candidate,
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
  // Indices the candidate has already spent the required dwell time on. Once
  // a question is in this set the Next/palette controls can navigate away
  // from it freely. This is index-based (not question-id) so the unlock
  // travels with position in the rendered list.
  const [unlocked, setUnlocked] = useState<Set<number>>(() => new Set());
  const [marked, setMarked] = useState<Set<string>>(() => new Set(initialMarked));
  const [submitting, setSubmitting] = useState(false);
  const [exitStep, setExitStep] = useState<ExitStep>('closed');
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [windowFocused, setWindowFocused] = useState(true);

  // Keep the latest answers/index/marked inside refs so heartbeat closures stay current.
  const answersRef = useRef(answers);
  const indexRef = useRef(currentIndex);
  const markedRef = useRef(marked);
  answersRef.current = answers;
  indexRef.current = currentIndex;
  markedRef.current = marked;

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

  // Track window focus so we can blur the exam content when the candidate
  // switches tabs / opens overlays — discourages over-the-shoulder + screen
  // capture of question content.
  useEffect(() => {
    const onFocus = () => setWindowFocused(true);
    const onBlur = () => setWindowFocused(false);
    const onVis = () => setWindowFocused(!document.hidden);
    window.addEventListener('focus', onFocus);
    window.addEventListener('blur', onBlur);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('visibilitychange', onVis);
    };
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

  // Per-question dwell timer — counts DOWN from perQuestionSeconds. When it
  // hits zero the question is "unlocked" and the candidate can move forward.
  // It does NOT auto-advance; visiting a question for any duration > the
  // dwell still requires a deliberate Next click.
  useEffect(() => {
    if (questions.length === 0) return;
    // If we're returning to a previously-unlocked question, no dwell required.
    if (unlocked.has(currentIndex)) {
      setPerQuestionLeft(0);
      return;
    }
    setPerQuestionLeft(perQuestionSeconds);
    const i = setInterval(() => {
      setPerQuestionLeft((prev) => {
        if (prev <= 1) {
          setUnlocked((u) => {
            if (u.has(currentIndex)) return u;
            const next = new Set(u);
            next.add(currentIndex);
            return next;
          });
          clearInterval(i);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(i);
  }, [currentIndex, perQuestionSeconds, questions.length, unlocked]);

  // Heartbeat every 30s — persists answers + index + marked-for-review.
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
            marked_for_review: Array.from(markedRef.current),
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
        body: JSON.stringify({
          answers: next,
          current_question_index: indexRef.current,
          marked_for_review: Array.from(markedRef.current),
        }),
        keepalive: true,
      }).catch(() => {});
      return next;
    });
  }, [examId]);

  const toggleMark = useCallback((qId: string) => {
    setMarked((prev) => {
      const next = new Set(prev);
      if (next.has(qId)) next.delete(qId); else next.add(qId);
      fetch(`/api/exams/${examId}/heartbeat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: answersRef.current,
          current_question_index: indexRef.current,
          marked_for_review: Array.from(next),
        }),
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
  const isUnlocked = unlocked.has(currentIndex);
  const dwellRemaining = isUnlocked ? 0 : perQuestionLeft;
  const lowQTime = !isUnlocked && perQuestionLeft <= 10 && perQuestionLeft > 0;
  const isCurrentMarked = currentQ ? marked.has(currentQ.id) : false;

  // Navigation guard — candidate may only move to questions they've already
  // unlocked, plus the immediate next one if the current question is unlocked.
  const canNavigateTo = useCallback((targetIndex: number) => {
    if (targetIndex === currentIndex) return true;
    if (targetIndex < 0 || targetIndex >= questions.length) return false;
    // Free movement to any previously-visited question.
    if (unlocked.has(targetIndex)) return true;
    // Forward by one is allowed only when the current question is unlocked.
    if (targetIndex === currentIndex + 1 && isUnlocked) return true;
    return false;
  }, [currentIndex, isUnlocked, questions.length, unlocked]);

  const watermarkText = (candidate.email || candidate.roll_no || 'pilotnote candidate').toString();

  return (
    <main className="grow pt-20 sm:pt-24 bg-white min-h-screen exam-lockdown relative select-none">
      {/* Watermark overlay — repeats the candidate's email/roll across the page
          so any screenshot is traceable. pointer-events:none so it doesn't
          interfere with answering. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-30 overflow-hidden"
        style={{ opacity: 0.07 }}
      >
        <div
          className="absolute inset-0 text-neutral-900 font-mono text-xs whitespace-nowrap"
          style={{
            transform: 'rotate(-24deg) scale(1.4)',
            transformOrigin: 'center',
            backgroundImage: 'none',
          }}
        >
          {Array.from({ length: 28 }).map((_, row) => (
            <div key={row} className="flex gap-12 py-3 leading-none">
              {Array.from({ length: 6 }).map((__, col) => (
                <span key={col}>{watermarkText} · {examId}</span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Blur shield — covers the exam when the window loses focus or the
          tab is hidden. The candidate sees a notice instead of question
          content, so casual screenshots of an unfocused exam catch nothing
          useful. */}
      {fullscreenAsked && !windowFocused && (
        <div className="fixed inset-0 z-140 bg-white/95 backdrop-blur-xl flex items-center justify-center p-6">
          <div className="max-w-md text-center">
            <span className="text-[11px] uppercase tracking-[0.22em] text-rose-600 font-semibold">Focus lost</span>
            <h2 className="font-display text-2xl sm:text-3xl text-neutral-900 mt-2 mb-3 tracking-tight">
              Return to the exam window
            </h2>
            <p className="text-neutral-600 text-sm leading-relaxed">
              Content is hidden while this tab is in the background. The clock keeps running.
              Click anywhere on this page to resume.
            </p>
          </div>
        </div>
      )}

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
              copy/paste attempts are logged and visible to administrators. Each question has a
              minimum dwell time — you cannot skip ahead instantly.
            </p>
            <Button variant="violet" size="lg" onClick={askFullscreen}>
              Start exam
            </Button>
          </div>
        </div>
      )}

      {/* Top bar */}
      <div className="sticky top-16 sm:top-20 bg-white/95 backdrop-blur-xl border-b border-neutral-200 z-40 px-3 sm:px-6 py-2.5 sm:py-4">
        <div className="container mx-auto flex justify-between items-center gap-2 sm:gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-base sm:text-xl text-neutral-900 tracking-tight truncate">{exam.title}</h1>
            <span className="hidden sm:inline text-[11px] uppercase tracking-[0.22em] text-neutral-500 font-medium">{exam.subject}</span>
          </div>
          <div className="flex items-center gap-3 sm:gap-6 shrink-0">
            <div className="flex flex-col items-end">
              <span className="text-[9px] uppercase tracking-[0.22em] text-neutral-400 font-medium">
                {isUnlocked ? 'Unlocked' : 'Min dwell'}
              </span>
              <span className={`font-mono text-sm tabular-nums ${
                isUnlocked ? 'text-emerald-600' : lowQTime ? 'text-rose-600' : 'text-neutral-700'
              }`}>
                {isUnlocked ? '✓' : `${dwellRemaining.toString().padStart(2, '0')}s`}
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="hidden sm:block text-[9px] uppercase tracking-[0.22em] text-neutral-400 font-medium">Time remaining</span>
              <span className={`font-mono text-sm sm:text-lg tabular-nums ${lowTime ? 'text-rose-600 animate-pulse' : 'text-neutral-900'}`}>
                {formatCountdown(remaining)}
              </span>
            </div>
            <button
              onClick={() => setPaletteOpen(true)}
              className="lg:hidden flex items-center justify-center w-9 h-9 rounded-full bg-neutral-900 text-white text-xs font-semibold tabular-nums"
              aria-label="Open question palette"
            >
              {currentIndex + 1}
            </button>
            <button
              onClick={() => setExitStep('first')}
              className="text-[11px] sm:text-xs font-medium text-neutral-500 hover:text-rose-600 transition-colors uppercase tracking-[0.18em]"
            >
              Exit
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-3 sm:px-6 py-5 sm:py-10 relative z-10">
        <div className="hidden sm:block text-[11px] text-neutral-500 leading-relaxed mb-6">
          Tab switches, fullscreen exits, copy attempts, and developer-tool shortcuts are logged and visible to administrators.
        </div>

        <div className="flex flex-col lg:flex-row gap-5 lg:gap-8">
          {/* Question panel */}
          <div className="grow min-w-0">
            <div className="border border-neutral-200 rounded-2xl sm:rounded-3xl p-5 sm:p-8 md:p-12 bg-white">
              <div className="flex justify-between items-center mb-5 sm:mb-8 gap-2 flex-wrap">
                <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.22em] text-neutral-500 font-medium">
                  Question {currentIndex + 1} of {questions.length}
                </span>
                <div className="flex items-center gap-2">
                  {currentQ && (
                    <button
                      onClick={() => toggleMark(currentQ.id)}
                      className={`px-2.5 py-1 sm:px-3 sm:py-1 text-[10px] uppercase tracking-[0.18em] rounded-full font-medium border transition-colors ${
                        isCurrentMarked
                          ? 'bg-amber-100 border-amber-300 text-amber-800'
                          : 'bg-white border-neutral-200 text-neutral-600 hover:border-amber-300 hover:text-amber-700'
                      }`}
                      aria-pressed={isCurrentMarked}
                    >
                      {isCurrentMarked ? '★ Marked for review' : '☆ Mark for review'}
                    </button>
                  )}
                  <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 bg-neutral-100 text-neutral-700 text-[10px] uppercase tracking-[0.18em] rounded-full font-medium">
                    1 mark
                  </span>
                </div>
              </div>

              <div className="mb-6 sm:mb-10">
                <div className="h-px bg-neutral-200 overflow-hidden">
                  <div
                    className="h-full bg-neutral-900 transition-all duration-500"
                    style={{ width: `${((currentIndex + 1) / Math.max(1, questions.length)) * 100}%` }}
                  />
                </div>
              </div>

              {questionIncomplete ? (
                <div className="mb-10 border border-amber-200 bg-amber-50 rounded-2xl p-5 sm:p-6">
                  <p className="text-amber-800 font-bold text-sm mb-1">This question is missing content.</p>
                  <p className="text-amber-700 text-sm">
                    The administrator hasn&apos;t finished setting it up. Skip ahead — you won&apos;t be marked
                    wrong for not answering it.
                  </p>
                </div>
              ) : (
                <>
                  {currentQ?.image_url && (
                    <div className="mb-6 sm:mb-8">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={currentQ.image_url}
                        alt="Question diagram"
                        className="max-w-full max-h-48 sm:max-h-72 rounded-2xl border border-neutral-200 object-contain"
                        draggable={false}
                      />
                    </div>
                  )}
                  <h2 className="font-display text-xl sm:text-2xl md:text-3xl text-neutral-900 mb-6 sm:mb-10 leading-snug tracking-tight">
                    {currentQText}
                  </h2>

                  <div className="space-y-2.5 sm:space-y-3 mb-8 sm:mb-12">
                    {currentQOptions.map((opt, i) => {
                      const trimmed = opt.trim();
                      if (!trimmed) return null;
                      const selected = answers[currentQ!.id] === i;
                      return (
                        <button
                          key={i}
                          onClick={() => recordAnswer(currentQ!.id, i)}
                          className={`group w-full flex items-start sm:items-center gap-3 sm:gap-5 p-3.5 sm:p-5 rounded-2xl border transition-all text-left active:scale-[0.99] ${
                            selected ? 'border-neutral-900 bg-neutral-50' : 'border-neutral-200 bg-white hover:border-neutral-900'
                          }`}
                        >
                          <span className={`w-8 h-8 sm:w-9 sm:h-9 shrink-0 flex items-center justify-center rounded-lg font-medium text-xs sm:text-sm transition-colors ${
                            selected ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-500'
                          }`}>
                            {String.fromCharCode(65 + i)}
                          </span>
                          <span className={`text-[14px] sm:text-[15px] leading-relaxed font-medium ${selected ? 'text-neutral-900' : 'text-neutral-700'}`}>
                            {trimmed}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              {!isUnlocked && !questionIncomplete && (
                <div className="mb-4 sm:mb-6 text-[11px] sm:text-xs text-neutral-500 bg-neutral-50 border border-neutral-200 rounded-xl px-3.5 py-2.5">
                  Read the question carefully — you can move on in <strong className="text-neutral-800 tabular-nums">{dwellRemaining}s</strong>.
                </div>
              )}

              <div className="flex flex-col-reverse sm:flex-row sm:justify-between sm:items-center gap-3 pt-5 sm:pt-8 border-t border-neutral-200">
                <Button
                  variant="secondary"
                  onClick={() => setCurrentIndex((p) => Math.max(0, p - 1))}
                  disabled={currentIndex === 0}
                  className="w-full sm:w-auto"
                >
                  ← Previous
                </Button>
                {currentIndex < questions.length - 1 ? (
                  <Button
                    variant="primary"
                    onClick={() => {
                      if (!isUnlocked) return;
                      setCurrentIndex((p) => p + 1);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    disabled={!isUnlocked}
                    className="w-full sm:w-auto"
                    title={!isUnlocked ? `Wait ${dwellRemaining}s before moving on` : undefined}
                  >
                    {isUnlocked ? 'Next →' : `Next in ${dwellRemaining}s`}
                  </Button>
                ) : (
                  <Button
                    variant="violet"
                    onClick={confirmSubmit}
                    disabled={submitting || !isUnlocked}
                    className="w-full sm:w-auto"
                    title={!isUnlocked ? `Wait ${dwellRemaining}s before submitting` : undefined}
                  >
                    {submitting ? 'Submitting…' : isUnlocked ? 'Submit exam' : `Submit in ${dwellRemaining}s`}
                  </Button>
                )}
              </div>
            </div>
            <p className="sm:hidden mt-4 text-[10.5px] text-neutral-500 leading-relaxed px-1">
              Tab switches, fullscreen exits, copy attempts, and screenshots are logged.
            </p>
          </div>

          {/* Sidebar palette — desktop only */}
          <aside className="hidden lg:block w-72 shrink-0">
            <div className="border border-neutral-200 rounded-3xl p-6 lg:sticky lg:top-44 bg-white">
              <h3 className="text-[11px] uppercase tracking-[0.22em] text-neutral-500 font-medium flex items-center gap-2 mb-4">
                <span className="w-6 h-px bg-neutral-900" /> Palette
              </h3>
              <p className="text-xs text-neutral-400 mb-6 font-mono">
                {answeredCount} / {questions.length} answered{marked.size > 0 ? ` · ${marked.size} marked` : ''}
              </p>
              <div className="grid grid-cols-5 gap-2 mb-6">
                {questions.map((q, i) => {
                  const allowed = canNavigateTo(i);
                  const isMarked = marked.has(q.id);
                  const isAnswered = answers[q.id] !== undefined;
                  const isCurrent = i === currentIndex;
                  const base =
                    isCurrent ? 'bg-neutral-900 border-neutral-900 text-white' :
                    isMarked && isAnswered ? 'bg-amber-500 border-amber-500 text-white' :
                    isMarked ? 'bg-amber-100 border-amber-300 text-amber-800' :
                    isAnswered ? 'bg-emerald-500 border-emerald-500 text-white' :
                    'bg-neutral-50 text-neutral-400 border-neutral-200';
                  return (
                    <button
                      key={q.id}
                      onClick={() => allowed && setCurrentIndex(i)}
                      disabled={!allowed}
                      title={!allowed ? 'Locked — finish the current question first' : undefined}
                      className={`w-10 h-10 rounded-lg border text-xs font-medium flex items-center justify-center transition-all ${base} ${
                        allowed ? 'hover:scale-105' : 'opacity-40 cursor-not-allowed'
                      }`}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>
              <div className="space-y-2 mb-6 text-[10px] uppercase tracking-[0.18em] text-neutral-500">
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-sm bg-emerald-500" /> Answered</div>
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-sm bg-amber-500" /> Marked for review</div>
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-sm bg-neutral-900" /> Current</div>
              </div>
              <Button
                variant="violet"
                className="w-full"
                onClick={confirmSubmit}
                disabled={submitting || !isUnlocked}
                title={!isUnlocked ? `Wait ${dwellRemaining}s before submitting` : undefined}
              >
                {submitting ? 'Submitting…' : isUnlocked ? 'Submit exam' : `Submit in ${dwellRemaining}s`}
              </Button>
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile palette — bottom sheet */}
      {paletteOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          onClick={() => setPaletteOpen(false)}
        >
          <div
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-5 pb-8 max-h-[80vh] overflow-y-auto pariksha-sheet-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-neutral-300 rounded-full mx-auto mb-4" />
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[11px] uppercase tracking-[0.22em] text-neutral-500 font-semibold">
                Question palette
              </h3>
              <span className="text-xs text-neutral-500 font-mono">{answeredCount} / {questions.length}</span>
            </div>
            <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 mb-5">
              {questions.map((q, i) => {
                const allowed = canNavigateTo(i);
                const isMarked = marked.has(q.id);
                const isAnswered = answers[q.id] !== undefined;
                const isCurrent = i === currentIndex;
                const base =
                  isCurrent ? 'bg-neutral-900 border-neutral-900 text-white' :
                  isMarked && isAnswered ? 'bg-amber-500 border-amber-500 text-white' :
                  isMarked ? 'bg-amber-100 border-amber-300 text-amber-800' :
                  isAnswered ? 'bg-emerald-500 border-emerald-500 text-white' :
                  'bg-neutral-50 text-neutral-500 border-neutral-200';
                return (
                  <button
                    key={q.id}
                    onClick={() => {
                      if (!allowed) return;
                      setCurrentIndex(i);
                      setPaletteOpen(false);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    disabled={!allowed}
                    className={`w-full aspect-square rounded-lg border text-xs font-semibold flex items-center justify-center tabular-nums ${base} ${
                      allowed ? '' : 'opacity-40 cursor-not-allowed'
                    }`}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-3 text-[10px] uppercase tracking-[0.18em] text-neutral-500 mb-5">
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-emerald-500" /> Answered</div>
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-amber-500" /> Marked</div>
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-neutral-900" /> Current</div>
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-neutral-200" /> Skipped</div>
            </div>
            <Button
              variant="violet"
              className="w-full"
              onClick={() => { setPaletteOpen(false); confirmSubmit(); }}
              disabled={submitting || !isUnlocked}
            >
              {submitting ? 'Submitting…' : isUnlocked ? 'Submit exam' : `Submit in ${dwellRemaining}s`}
            </Button>
          </div>
        </div>
      )}

      {/* Submit confirmation */}
      <Dialog
        open={showSubmitConfirm}
        title="Submit your answers?"
        description={
          <>
            You&apos;ve answered <strong>{answeredCount}</strong> of <strong>{questions.length}</strong> questions.
            {marked.size > 0 && (
              <> <strong>{marked.size}</strong> {marked.size === 1 ? 'question is' : 'questions are'} still marked for review.</>
            )}{' '}
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
