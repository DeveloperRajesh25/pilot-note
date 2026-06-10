'use client';

import { useState } from 'react';
import { Check, X, Clock } from 'lucide-react';
import type { DgcaQuestion } from '@/lib/types';

// Shared, detailed DGCA practice review — used both right after submitting a
// chapter (in the practice flow) and when revisiting a saved result from the
// profile. Mirrors the Pariksha answer-key layout: each question shows the
// candidate's pick, the correct option highlighted, and the full explanation.

export interface DgcaReviewQuestion
  extends Pick<DgcaQuestion, 'id' | 'question' | 'options' | 'correct' | 'explanation'> {
  marks?: number;
  image_url?: string | null;
}

type Filter = 'all' | 'right' | 'wrong' | 'skipped';

export function DgcaResultReview({
  chapterTitle,
  subjectName,
  questions,
  answers,
}: {
  chapterTitle: string;
  subjectName?: string | null;
  questions: DgcaReviewQuestion[];
  answers: (number | null)[];
}) {
  const [filter, setFilter] = useState<Filter>('all');

  const marksOf = (q: DgcaReviewQuestion) => q.marks ?? 1;
  const totalMarks = questions.reduce((acc, q) => acc + marksOf(q), 0);
  const obtainedMarks = questions.reduce(
    (acc, q, i) => acc + (answers[i] === q.correct ? marksOf(q) : 0),
    0
  );
  const percentage = totalMarks ? Math.round((obtainedMarks / totalMarks) * 100) : 0;
  const pctColor = percentage >= 70 ? 'text-emerald-500' : percentage >= 50 ? 'text-amber-500' : 'text-rose-500';

  const counts = questions.reduce(
    (acc, q, i) => {
      const sel = answers[i];
      if (sel === null || sel === undefined) acc.skipped++;
      else if (sel === q.correct) acc.right++;
      else acc.wrong++;
      return acc;
    },
    { right: 0, wrong: 0, skipped: 0 }
  );

  const visible = questions
    .map((q, i) => ({ q, i }))
    .filter(({ q, i }) => {
      const sel = answers[i];
      if (filter === 'all') return true;
      if (filter === 'skipped') return sel === null || sel === undefined;
      if (filter === 'right') return sel === q.correct;
      return sel !== null && sel !== undefined && sel !== q.correct;
    });

  return (
    <div className="max-w-3xl mx-auto">
      <span className="text-[11px] uppercase tracking-[0.22em] text-neutral-500 font-medium flex items-center gap-2 mb-5">
        <span className="w-6 h-px bg-neutral-900" /> Practice review{subjectName ? ` · ${subjectName}` : ''}
      </span>
      <h2 className="font-display text-4xl sm:text-5xl md:text-6xl text-neutral-900 mb-3 tracking-tight">
        Your <span className="italic-serif">result.</span>
      </h2>
      <p className="text-neutral-500 mb-8 sm:mb-12">{chapterTitle}</p>

      {/* Score summary */}
      <div className="grid md:grid-cols-2 gap-px bg-neutral-200 border border-neutral-200 rounded-2xl sm:rounded-3xl overflow-hidden mb-10 sm:mb-12">
        <div className="bg-white p-8 sm:p-10 flex flex-col items-center justify-center">
          <div className="relative w-36 h-36 sm:w-44 sm:h-44 mb-4">
            <svg viewBox="0 0 176 176" className="w-full h-full transform -rotate-90">
              <circle cx="88" cy="88" r="76" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-neutral-100" />
              <circle cx="88" cy="88" r="76" stroke="currentColor" strokeWidth="6" fill="transparent"
                strokeDasharray={2 * Math.PI * 76}
                strokeDashoffset={2 * Math.PI * 76 * (1 - percentage / 100)}
                strokeLinecap="round" className={`transition-all duration-1000 ${pctColor}`} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`font-display text-4xl sm:text-5xl leading-none ${pctColor}`}>{percentage}%</span>
              <span className="text-[11px] uppercase tracking-[0.22em] text-neutral-400 mt-1.5">Overall score</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.18em] text-neutral-500 font-mono">
            <Clock className="w-3 h-3" /> {counts.right + counts.wrong}/{questions.length} attempted
          </div>
        </div>
        <div className="bg-white p-8 sm:p-10 flex flex-col justify-center text-center md:text-left items-center md:items-start">
          <span className="text-[11px] uppercase tracking-[0.22em] text-neutral-400 font-medium mb-3">Marks scored</span>
          <p className="font-display text-5xl sm:text-6xl leading-none mb-3 text-neutral-900">
            {obtainedMarks}<span className="text-neutral-300">/{totalMarks}</span>
          </p>
          <p className="text-neutral-500 text-sm">
            {counts.right} correct · {counts.wrong} wrong · {counts.skipped} skipped. Review the
            correct answers and explanations below to sharpen weak spots.
          </p>
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

      {/* Per-question detail */}
      <div className="space-y-4">
        {visible.map(({ q, i }) => {
          const sel = answers[i];
          const skipped = sel === null || sel === undefined;
          const isCorrect = sel === q.correct;
          return (
            <div
              key={q.id}
              className={`border rounded-3xl p-5 sm:p-7 ${
                skipped ? 'border-neutral-200' :
                isCorrect ? 'border-emerald-200 bg-emerald-50/30' :
                'border-rose-200 bg-rose-50/30'
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-[11px] uppercase tracking-[0.18em] text-neutral-500 font-mono shrink-0">
                  Q{i + 1}
                </span>
                {skipped ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-neutral-200 text-neutral-700 text-[10px] font-bold uppercase tracking-wider">
                    Skipped
                  </span>
                ) : isCorrect ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wider">
                    <Check className="w-3 h-3" /> Correct
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold uppercase tracking-wider">
                    <X className="w-3 h-3" /> Wrong
                  </span>
                )}
                <span className="ml-auto shrink-0 text-[11px] font-bold font-mono px-2 py-0.5 rounded-full border bg-violet-50 text-violet-700 border-violet-200/60">
                  {isCorrect ? marksOf(q) : 0}/{marksOf(q)}
                </span>
              </div>
              {q.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={q.image_url} alt="Question diagram" className="max-w-full max-h-60 rounded-2xl border border-neutral-200 object-contain mb-4" />
              )}
              <h3 className="font-display text-lg sm:text-xl text-neutral-900 mb-4 leading-snug">
                {q.question}
              </h3>
              <div className="space-y-2 mb-4">
                {q.options.map((opt, oi) => {
                  const isYour = sel === oi;
                  const isRight = q.correct === oi;
                  const stateClass = isRight
                    ? 'border-emerald-400 bg-emerald-50'
                    : isYour
                    ? 'border-rose-400 bg-rose-50'
                    : 'border-neutral-200 bg-white';
                  return (
                    <div key={oi} className={`flex items-start gap-3 p-3 sm:p-4 rounded-2xl border ${stateClass}`}>
                      <span className={`w-7 h-7 sm:w-8 sm:h-8 shrink-0 flex items-center justify-center rounded-lg font-semibold text-[12px] sm:text-sm ${
                        isRight ? 'bg-emerald-600 text-white' :
                        isYour ? 'bg-rose-500 text-white' :
                        'bg-neutral-100 text-neutral-500'
                      }`}>
                        {String.fromCharCode(65 + oi)}
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
        {visible.length === 0 && (
          <div className="text-center py-12 text-neutral-500 border border-neutral-200 rounded-3xl">
            Nothing in this filter.
          </div>
        )}
      </div>
    </div>
  );
}
