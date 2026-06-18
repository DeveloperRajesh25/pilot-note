'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Check, X, Loader2, Trophy } from 'lucide-react';

interface Question {
  id: string;
  question: string;
  options: string[];
  correct: number;
  explanation: string | null;
  image_url: string | null;
}

interface AnswerKeyPayload {
  exam: { id: string; title: string; subject: string; pass_score: number };
  attempt: {
    score: number | null;
    total: number | null;
    rank: number | null;
    auto_submitted: boolean | null;
    total_candidates: number;
    roll_no: string | null;
  };
  answers: Record<string, number>;
  questions: Question[];
}

export default function AnswerKeyPage({ params }: { params: Promise<{ examId: string }> }) {
  const { examId } = use(params);
  const router = useRouter();
  const [data, setData] = useState<AnswerKeyPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'wrong' | 'right' | 'skipped'>('all');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch(`/api/exams/${examId}/answers`, { cache: 'no-store' });
      if (res.status === 401) { router.push(`/pariksha/login?exam=${examId}`); return; }
      const d = await res.json();
      if (cancelled) return;
      if (!res.ok) { setError(d?.error ?? 'Failed to load answer key'); return; }
      setData(d);
    })();
    return () => { cancelled = true; };
  }, [examId, router]);

  // Content protection — the question bank is exclusive to Pilot Note. Block
  // copy, cut, paste, right-click, drag, text selection and the common
  // save/print/devtools shortcuts while viewing the answer key. Selection and
  // image drag are also disabled via the `.exam-lockdown` class on <main>.
  useEffect(() => {
    const block = (e: Event) => e.preventDefault();
    const onKeyDown = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;
      const k = e.key.toLowerCase();
      if (e.key === 'F12') { e.preventDefault(); return; }
      if (ctrl && e.shiftKey && (k === 'i' || k === 'j' || k === 'c')) { e.preventDefault(); return; }
      if (ctrl && (k === 'c' || k === 'x' || k === 'a' || k === 's' || k === 'p' || k === 'u')) {
        e.preventDefault();
      }
    };
    const events: [string, EventListener][] = [
      ['contextmenu', block], ['copy', block], ['cut', block], ['paste', block],
      ['dragstart', block], ['selectstart', block], ['keydown', onKeyDown as EventListener],
    ];
    events.forEach(([type, fn]) => document.addEventListener(type, fn));
    return () => events.forEach(([type, fn]) => document.removeEventListener(type, fn));
  }, []);

  if (error) {
    return (
      <>
        <Header />
        <main className="grow pt-40 sm:pt-48 flex items-center justify-center bg-white px-4">
          <div className="text-center max-w-md p-8 sm:p-12 border border-neutral-200 rounded-3xl">
            <h2 className="font-display text-3xl sm:text-4xl text-neutral-900 mb-4">Answer key unavailable</h2>
            <p className="text-rose-600 mb-8 text-sm">{error}</p>
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
            <p className="text-neutral-500 mt-4 text-sm uppercase tracking-[0.18em]">Loading answer key…</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const { exam, attempt, answers, questions } = data;
  const score = attempt.score ?? 0;
  const total = attempt.total ?? questions.length;
  const pct = total > 0 ? Math.round((score / total) * 100) : 0;
  const passed = pct >= (exam.pass_score ?? 40);

  const counts = questions.reduce(
    (acc, q) => {
      const sel = answers[q.id];
      if (sel === undefined) acc.skipped++;
      else if (sel === q.correct) acc.right++;
      else acc.wrong++;
      return acc;
    },
    { right: 0, wrong: 0, skipped: 0 }
  );

  const filtered = questions.filter((q) => {
    if (filter === 'all') return true;
    const sel = answers[q.id];
    if (filter === 'skipped') return sel === undefined;
    if (filter === 'right') return sel === q.correct;
    return sel !== undefined && sel !== q.correct;
  });

  return (
    <>
      <Header />
      <main className="grow pt-28 sm:pt-32 pb-20 bg-white exam-lockdown">
        <div className="container mx-auto px-4 sm:px-6 max-w-3xl">
          <span className="text-[11px] uppercase tracking-[0.22em] text-neutral-500 font-medium flex items-center gap-2 mb-5">
            <span className="w-6 h-px bg-neutral-900" /> Answer key · {exam.subject}
          </span>
          <h1 className="font-display text-3xl sm:text-5xl text-neutral-900 leading-[1.05] tracking-[-0.03em] mb-3">
            {exam.title}
          </h1>
          <p className="text-neutral-600 mb-8 text-sm sm:text-base">
            {attempt.roll_no && (
              <span className="font-mono text-neutral-900 mr-3">{attempt.roll_no}</span>
            )}
            {attempt.auto_submitted ? 'Auto-submitted.' : 'Submitted by you.'}
          </p>

          {/* Score panel */}
          <div className={`border rounded-3xl p-6 sm:p-8 mb-6 ${passed ? 'border-emerald-200 bg-emerald-50' : 'border-rose-200 bg-rose-50'}`}>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4">
                <Trophy className={`w-10 h-10 ${passed ? 'text-emerald-600' : 'text-rose-500'}`} strokeWidth={1.5} />
                <div>
                  <p className="text-[10px] uppercase tracking-[0.22em] text-neutral-500 font-semibold">
                    {passed ? 'Passed' : 'Not passed'}
                  </p>
                  <p className="font-display text-4xl sm:text-5xl text-neutral-900 leading-none tracking-tight">
                    {pct}%
                  </p>
                  <p className="text-xs text-neutral-600 mt-1">{score} / {total} correct</p>
                </div>
              </div>
              {attempt.rank !== null && attempt.rank !== undefined && (
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-neutral-500 font-semibold">All-India rank</p>
                  <p className="font-display text-4xl sm:text-5xl text-neutral-900 leading-none tracking-tight tabular-nums">
                    {attempt.rank}
                  </p>
                  <p className="text-xs text-neutral-600 mt-1">of {attempt.total_candidates}</p>
                </div>
              )}
            </div>
          </div>

          {/* Filter */}
          <div className="flex gap-2 overflow-x-auto pb-1 mb-6 -mx-4 px-4 sm:mx-0 sm:px-0">
            {([
              ['all', `All (${questions.length})`],
              ['right', `Correct (${counts.right})`],
              ['wrong', `Wrong (${counts.wrong})`],
              ['skipped', `Skipped (${counts.skipped})`],
            ] as const).map(([k, label]) => (
              <button
                key={k}
                onClick={() => setFilter(k)}
                className={`shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-colors ${
                  filter === k ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Questions */}
          <div className="space-y-4">
            {filtered.map((q, idx) => {
              const sel = answers[q.id];
              const isCorrect = sel === q.correct;
              const skipped = sel === undefined;
              return (
                <div
                  key={q.id}
                  className={`border rounded-3xl p-5 sm:p-7 ${
                    skipped ? 'border-neutral-200' :
                    isCorrect ? 'border-emerald-200 bg-emerald-50/30' :
                    'border-rose-200 bg-rose-50/30'
                  }`}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <span className="text-[11px] uppercase tracking-[0.18em] text-neutral-500 font-mono shrink-0 mt-1">
                      Q{idx + 1}
                    </span>
                    {!skipped && (
                      isCorrect
                        ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wider">
                            <Check className="w-3 h-3" /> Correct
                          </span>
                        : <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold uppercase tracking-wider">
                            <X className="w-3 h-3" /> Wrong
                          </span>
                    )}
                    {skipped && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-neutral-200 text-neutral-700 text-[10px] font-bold uppercase tracking-wider">
                        Skipped
                      </span>
                    )}
                  </div>
                  {q.image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={q.image_url} alt="Question diagram" className="max-w-full max-h-60 rounded-2xl border border-neutral-200 object-contain mb-4" />
                  )}
                  <h3 className="font-display text-lg sm:text-xl text-neutral-900 mb-4 leading-snug">
                    {q.question}
                  </h3>
                  <div className="space-y-2 mb-4">
                    {q.options.map((opt, i) => {
                      const isYour = sel === i;
                      const isRight = q.correct === i;
                      const stateClass = isRight
                        ? 'border-emerald-400 bg-emerald-50'
                        : isYour
                        ? 'border-rose-400 bg-rose-50'
                        : 'border-neutral-200 bg-white';
                      return (
                        <div key={i} className={`flex items-start gap-3 p-3 sm:p-4 rounded-2xl border ${stateClass}`}>
                          <span className={`w-7 h-7 sm:w-8 sm:h-8 shrink-0 flex items-center justify-center rounded-lg font-semibold text-[12px] sm:text-sm ${
                            isRight ? 'bg-emerald-600 text-white' :
                            isYour ? 'bg-rose-500 text-white' :
                            'bg-neutral-100 text-neutral-500'
                          }`}>
                            {String.fromCharCode(65 + i)}
                          </span>
                          <span className="text-[13.5px] sm:text-[15px] text-neutral-900 leading-relaxed flex-1">{opt}</span>
                          <div className="flex flex-col items-end gap-1 shrink-0 text-[10px] uppercase tracking-[0.12em] font-bold">
                            {isRight && <span className="text-emerald-700">Correct</span>}
                            {isYour && !isRight && <span className="text-rose-700">Your pick</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {q.explanation && (
                    <div className="mt-3 pt-4 border-t border-neutral-200/70">
                      <p className="text-[10px] uppercase tracking-[0.22em] text-neutral-500 font-semibold mb-2">Explanation</p>
                      <p className="text-[13.5px] sm:text-sm text-neutral-700 leading-relaxed">{q.explanation}</p>
                    </div>
                  )}
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div className="text-center py-12 text-neutral-500 border border-neutral-200 rounded-3xl">
                Nothing in this filter.
              </div>
            )}
          </div>

          <div className="mt-10 flex gap-3 flex-wrap">
            <Button variant="primary" href="/pariksha">Back to exams</Button>
            <Button variant="secondary" href={`/pariksha/${examId}/results`}>Results card</Button>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
