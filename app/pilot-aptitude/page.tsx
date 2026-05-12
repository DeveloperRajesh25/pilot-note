"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { APTITUDE_CATEGORIES } from '@/app/constants/data';
import { Button } from '@/components/ui/Button';
import {
  Box,
  Hash,
  MessageSquare,
  Gauge,
  Clock,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

interface Question {
  id: string;
  category: string;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

interface AptitudeResult {
  id: string;
  category: string;
  score: number;
  total: number;
  time_taken: number;
  created_at: string;
}

type ViewType = 'selection' | 'test' | 'results' | 'history';

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'Spatial Reasoning': <Box className="w-5 h-5" strokeWidth={1.5} />,
  'Numerical Ability': <Hash className="w-5 h-5" strokeWidth={1.5} />,
  'Verbal Reasoning': <MessageSquare className="w-5 h-5" strokeWidth={1.5} />,
  'Instrument Comprehension': <Gauge className="w-5 h-5" strokeWidth={1.5} />,
};

const CATEGORY_DESCS: Record<string, string> = {
  'Spatial Reasoning': 'Mental rotation, spatial relationships, and 3D visualization.',
  'Numerical Ability': 'Aviation calculations — fuel, time, distance, and weight.',
  'Verbal Reasoning': 'Communication, vocabulary, analogies, and comprehension.',
  'Instrument Comprehension': 'Read and interpret cockpit instruments accurately.',
};

export default function PilotAptitudePage() {
  const [view, setView] = useState<ViewType>('selection');
  const [currentCategory, setCurrentCategory] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isFullTest, setIsFullTest] = useState(false);
  const [history, setHistory] = useState<AptitudeResult[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (view === 'test') {
      interval = setInterval(() => setElapsedSeconds(prev => prev + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [view]);

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch('/api/aptitude/results');
      if (res.ok) {
        const data = await res.json();
        setHistory(data.results ?? []);
      }
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const startTest = useCallback(async (category: string | null) => {
    setQuestionsLoading(true);
    const isFull = !category;
    try {
      const url = category ? `/api/questions?category=${encodeURIComponent(category)}` : '/api/questions';
      const res = await fetch(url);
      const data = await res.json();
      const qs: Question[] = data.questions ?? [];
      setQuestions(qs);
      setAnswers(new Array(qs.length).fill(null));
      setCurrentIndex(0);
      setElapsedSeconds(0);
      setIsFullTest(isFull);
      setCurrentCategory(category || 'Full COMPASS Test');
      setView('test');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setQuestionsLoading(false);
    }
  }, []);

  const handleAnswer = (optionIndex: number) => {
    if (answers[currentIndex] !== null) return;
    const next = [...answers];
    next[currentIndex] = optionIndex;
    setAnswers(next);
  };

  const finishTest = async () => {
    const correctCount = questions.reduce((acc, q, i) => acc + (answers[i] === q.correct ? 1 : 0), 0);
    const answersMap: Record<string, number | null> = {};
    questions.forEach((q, i) => { answersMap[q.id] = answers[i]; });

    setSaving(true);
    try {
      await fetch('/api/aptitude/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: currentCategory,
          score: correctCount,
          total: questions.length,
          time_taken: elapsedSeconds,
          answers: answersMap,
        }),
      });
    } catch { /* non-critical */ }
    setSaving(false);

    setView('results');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <>
      <Header />
      <main className="grow pt-36 pb-32 bg-white min-h-screen">
        <div className="container mx-auto px-6">
          {view === 'selection' && (
            <SelectionView
              onStart={startTest}
              loading={questionsLoading}
              onHistory={() => { fetchHistory(); setView('history'); }}
            />
          )}
          {view === 'history' && (
            <HistoryView history={history} loading={historyLoading} onBack={() => setView('selection')} />
          )}
          {view === 'test' && (
            <div className="max-w-3xl mx-auto">
              {/* Top bar */}
              <div className="flex justify-between items-center mb-10">
                <span className="text-[11px] uppercase tracking-[0.22em] text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-3 py-1 rounded-full font-medium">
                  {currentCategory}
                </span>
                <div className="flex items-center gap-2 font-mono text-base text-neutral-700">
                  <Clock className="w-4 h-4" strokeWidth={1.5} />
                  {formatTime(elapsedSeconds)}
                </div>
              </div>

              {/* Progress */}
              <div className="mb-10">
                <div className="flex justify-between text-xs font-medium text-neutral-500 mb-3 tracking-wide">
                  <span>Question {currentIndex + 1} of {questions.length}</span>
                  <span>{Math.round(((currentIndex + 1) / questions.length) * 100)}%</span>
                </div>
                <div className="h-px bg-neutral-200 overflow-hidden">
                  <div
                    className="h-full bg-neutral-900 transition-all duration-500"
                    style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Question */}
              <h2 className="font-display text-3xl md:text-4xl text-neutral-900 leading-tight tracking-tight mb-10">
                {questions[currentIndex]?.question}
              </h2>

              <div className="space-y-3 mb-8">
                {questions[currentIndex]?.options.map((opt, i) => {
                  const isSelected = answers[currentIndex] === i;
                  const isCorrect = questions[currentIndex].correct === i;
                  const hasAnswered = answers[currentIndex] !== null;

                  let cls = 'border-neutral-200 hover:border-neutral-900 bg-white';
                  let textCls = 'text-neutral-700';
                  let letterCls = 'bg-neutral-100 text-neutral-500';

                  if (hasAnswered) {
                    if (isCorrect) {
                      cls = 'border-emerald-500 bg-emerald-50/50';
                      textCls = 'text-neutral-900';
                      letterCls = 'bg-emerald-500 text-white';
                    } else if (isSelected) {
                      cls = 'border-rose-400 bg-rose-50/50';
                      textCls = 'text-neutral-900';
                      letterCls = 'bg-rose-500 text-white';
                    }
                  } else if (isSelected) {
                    cls = 'border-neutral-900 bg-neutral-50';
                    textCls = 'text-neutral-900';
                    letterCls = 'bg-neutral-900 text-white';
                  }

                  return (
                    <button
                      key={i}
                      onClick={() => handleAnswer(i)}
                      disabled={hasAnswered}
                      className={`group w-full flex items-center gap-5 p-5 rounded-2xl border transition-all text-left ${cls}`}
                    >
                      <span className={`w-9 h-9 shrink-0 flex items-center justify-center rounded-lg font-medium text-sm transition-colors ${letterCls}`}>
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span className={`text-[15px] font-medium ${textCls}`}>{opt}</span>
                    </button>
                  );
                })}
              </div>

              {/* Explanation */}
              {answers[currentIndex] !== null && (
                <div className="mb-8 p-5 border-l-2 border-emerald-500 bg-emerald-50/40 rounded-r-xl">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-emerald-700 font-medium mb-2">
                    Explanation
                  </p>
                  <p className="text-neutral-700 text-[15px] leading-relaxed">{questions[currentIndex]?.explanation}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-between items-center pt-8 border-t border-neutral-200">
                <Button
                  variant="secondary"
                  onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentIndex === 0}
                >
                  <ArrowLeft className="w-4 h-4" /> Previous
                </Button>
                {currentIndex === questions.length - 1 ? (
                  <Button
                    variant="violet"
                    onClick={finishTest}
                    disabled={answers[currentIndex] === null || saving}
                  >
                    {saving ? 'Saving…' : 'Finish test'}
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    onClick={() => { setCurrentIndex(prev => prev + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    disabled={answers[currentIndex] === null}
                  >
                    Next <ArrowRight className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          )}

          {view === 'results' && (
            <ResultsView
              questions={questions}
              answers={answers}
              elapsedSeconds={elapsedSeconds}
              onRetry={() => startTest(isFullTest ? null : currentCategory)}
              onBack={() => setView('selection')}
              category={currentCategory || ''}
            />
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

function SelectionView({
  onStart,
  loading,
  onHistory,
}: {
  onStart: (cat: string | null) => void;
  loading: boolean;
  onHistory: () => void;
}) {
  return (
    <div>
      {/* Header */}
      <div className="grid lg:grid-cols-12 gap-10 mb-16 items-end">
        <div className="lg:col-span-8">
          <span className="text-[11px] uppercase tracking-[0.22em] text-neutral-500 font-medium flex items-center gap-2 mb-6">
            <span className="w-6 h-px bg-neutral-900" />
            COMPASS Aptitude
          </span>
          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl leading-[0.95] tracking-[-0.03em] text-neutral-900">
            Test your <span className="italic-serif">aptitude.</span>
          </h1>
        </div>
        <div className="lg:col-span-4">
          <p className="text-neutral-600 text-lg leading-relaxed">
            Assess your skills across the four COMPASS aptitude domains used by airline selection.
          </p>
        </div>
      </div>

      {/* CTAs */}
      <div className="flex flex-wrap items-center gap-3 mb-16 pb-12 border-b border-neutral-200">
        <Button variant="violet" size="lg" onClick={() => onStart(null)} disabled={loading}>
          {loading ? 'Loading…' : 'Take full COMPASS test'}
          {!loading && <ArrowRight className="w-4 h-4" />}
        </Button>
        <Button variant="secondary" size="lg" onClick={onHistory}>
          <BarChart3 className="w-4 h-4" /> My history
        </Button>
      </div>

      {/* Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
        {APTITUDE_CATEGORIES.map((cat, idx) => (
          <button
            key={cat}
            onClick={() => !loading && onStart(cat)}
            className="group bg-white border border-neutral-200 rounded-3xl p-8 lg:p-10 text-left transition-all duration-300 hover:border-neutral-900 hover:shadow-[0_24px_48px_-24px_rgba(10,10,10,0.18)] flex flex-col"
          >
            <div className="flex items-center justify-between mb-10">
              <div className="w-12 h-12 rounded-xl bg-neutral-100 group-hover:bg-emerald-500 group-hover:text-white text-neutral-900 flex items-center justify-center transition-colors">
                {CATEGORY_ICONS[cat]}
              </div>
              <span className="text-[11px] tracking-[0.22em] uppercase text-neutral-400 font-mono">
                Module {String(idx + 1).padStart(2, '0')}
              </span>
            </div>

            <h3 className="font-display text-3xl text-neutral-900 mb-3 leading-tight">{cat}</h3>
            <p className="text-neutral-600 text-[15px] leading-relaxed mb-8">
              {CATEGORY_DESCS[cat]}
            </p>

            <div className="mt-auto flex items-center justify-between pt-6 border-t border-neutral-100">
              <span className="text-[11px] uppercase tracking-[0.18em] text-neutral-400 font-medium">
                6 questions
              </span>
              <span className="text-sm font-medium text-neutral-900 flex items-center gap-2 link-underline">
                Start test <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function HistoryView({
  history,
  loading,
  onBack,
}: {
  history: AptitudeResult[];
  loading: boolean;
  onBack: () => void;
}) {
  return (
    <div className="max-w-3xl mx-auto">
      <button
        onClick={onBack}
        className="group inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-900 mb-10 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
        Back to categories
      </button>

      <span className="text-[11px] uppercase tracking-[0.22em] text-neutral-500 font-medium flex items-center gap-2 mb-5">
        <span className="w-6 h-px bg-neutral-900" />
        Activity
      </span>
      <h2 className="font-display text-4xl md:text-5xl text-neutral-900 mb-12 tracking-tight">
        Your <span className="italic-serif">history.</span>
      </h2>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-20 skeleton rounded-2xl" />)}
        </div>
      ) : history.length === 0 ? (
        <div className="border border-neutral-200 rounded-3xl py-24 text-center">
          <BarChart3 className="w-10 h-10 text-neutral-300 mx-auto mb-4" strokeWidth={1.5} />
          <p className="text-neutral-500">No tests taken yet. Start your first test.</p>
        </div>
      ) : (
        <div className="border border-neutral-200 rounded-3xl divide-y divide-neutral-200 overflow-hidden">
          {history.map(r => {
            const pct = Math.round((r.score / r.total) * 100);
            const colorClass =
              pct >= 70 ? 'text-emerald-600' : pct >= 50 ? 'text-amber-600' : 'text-rose-600';
            return (
              <div key={r.id} className="px-6 py-5 flex items-center justify-between hover:bg-neutral-50 transition-colors">
                <div>
                  <p className="font-medium text-neutral-900 mb-1">{r.category}</p>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-400 font-mono">
                    {new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} · {Math.floor(r.time_taken / 60)}m {r.time_taken % 60}s
                  </p>
                </div>
                <div className="text-right">
                  <p className={`font-display text-3xl tracking-tight leading-none ${colorClass}`}>{pct}%</p>
                  <p className="text-[11px] text-neutral-400 mt-1">{r.score}/{r.total}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ResultsView({
  questions,
  answers,
  elapsedSeconds,
  onRetry,
  onBack,
  category,
}: {
  questions: Question[];
  answers: (number | null)[];
  elapsedSeconds: number;
  onRetry: () => void;
  onBack: () => void;
  category: string;
}) {
  const correctCount = questions.reduce((acc, q, i) => acc + (answers[i] === q.correct ? 1 : 0), 0);
  const percentage = Math.round((correctCount / questions.length) * 100);

  const categoryScores: Record<string, { correct: number; total: number }> = {};
  questions.forEach((q, i) => {
    if (!categoryScores[q.category]) categoryScores[q.category] = { correct: 0, total: 0 };
    categoryScores[q.category].total++;
    if (answers[i] === q.correct) categoryScores[q.category].correct++;
  });

  const timeTaken = `${Math.floor(elapsedSeconds / 60)}m ${elapsedSeconds % 60}s`;
  const passed = percentage >= 70;
  const pctColor = passed ? 'text-emerald-500' : percentage >= 50 ? 'text-amber-500' : 'text-rose-500';

  return (
    <div className="max-w-3xl mx-auto">
      <span className="text-[11px] uppercase tracking-[0.22em] text-neutral-500 font-medium flex items-center gap-2 mb-5">
        <span className="w-6 h-px bg-neutral-900" />
        Test complete
      </span>
      <h2 className="font-display text-5xl md:text-6xl text-neutral-900 mb-3 tracking-tight">
        Your <span className="italic-serif">result.</span>
      </h2>
      <p className="text-neutral-500 mb-12">{category}</p>

      <div className="grid md:grid-cols-2 gap-px bg-neutral-200 border border-neutral-200 rounded-3xl overflow-hidden mb-12">
        {/* Score circle */}
        <div className="bg-white p-10 flex flex-col items-center justify-center">
          <div className="relative w-44 h-44 mb-4">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="88" cy="88" r="76" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-neutral-100" />
              <circle
                cx="88"
                cy="88"
                r="76"
                stroke="currentColor"
                strokeWidth="6"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 76}
                strokeDashoffset={2 * Math.PI * 76 * (1 - percentage / 100)}
                strokeLinecap="round"
                className={`transition-all duration-1000 ${pctColor}`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display text-5xl text-neutral-900 leading-none">{percentage}%</span>
              <span className="text-[10px] uppercase tracking-[0.22em] text-neutral-400 mt-2">{correctCount}/{questions.length}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.18em] text-neutral-500 font-mono">
            <Clock className="w-3 h-3" /> {timeTaken}
          </div>
        </div>

        {/* Pass/fail summary */}
        <div className="bg-white p-10 flex flex-col justify-center">
          <span className="text-[11px] uppercase tracking-[0.22em] text-neutral-400 font-medium mb-3">
            Outcome
          </span>
          <p className={`font-display text-5xl leading-none mb-2 ${passed ? 'text-emerald-600' : 'text-rose-500'}`}>
            {passed ? 'Passed' : 'Try again'}
          </p>
          <p className="text-neutral-500 text-sm">
            {passed
              ? "Strong showing. You're tracking well for COMPASS-style assessments."
              : 'Practice individual modules and retry the full test to improve.'}
          </p>
        </div>
      </div>

      {/* Category breakdown */}
      <div className="mb-12">
        <h3 className="text-[11px] uppercase tracking-[0.22em] text-neutral-500 font-medium mb-5">
          Performance breakdown
        </h3>
        <div className="space-y-4">
          {Object.entries(categoryScores).map(([cat, score]) => {
            const catPct = Math.round((score.correct / score.total) * 100);
            const barColor = catPct >= 70 ? 'bg-emerald-500' : catPct >= 50 ? 'bg-amber-500' : 'bg-rose-500';
            return (
              <div key={cat}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-neutral-900">{cat}</span>
                  <span className="text-sm font-medium text-neutral-700 font-mono">{catPct}%</span>
                </div>
                <div className="h-px bg-neutral-200 overflow-hidden">
                  <div className={`h-full ${barColor} transition-all duration-700`} style={{ width: `${catPct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detailed review */}
      <div className="mb-12">
        <h3 className="text-[11px] uppercase tracking-[0.22em] text-neutral-500 font-medium mb-5">
          Question review
        </h3>
        <div className="border border-neutral-200 rounded-2xl divide-y divide-neutral-200 overflow-hidden">
          {questions.map((q, i) => {
            const ok = answers[i] === q.correct;
            return (
              <div key={q.id} className="px-5 py-4 flex items-start gap-4">
                {ok ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-400 mt-0.5 shrink-0" />
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium text-neutral-900 mb-1">Q{i + 1}. {q.question}</p>
                  <p className="text-xs text-neutral-500 line-clamp-2">{q.explanation}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button variant="primary" size="lg" onClick={onRetry}>Retry test</Button>
        <Button variant="secondary" size="lg" onClick={onBack}>Back to categories</Button>
      </div>
    </div>
  );
}
