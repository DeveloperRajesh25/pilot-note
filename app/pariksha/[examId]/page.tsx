'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';

interface Question {
  id: string;
  question: string;
  options: string[];
}

interface ExamMeta {
  title: string;
  subject: string;
  duration: number;
  total_questions: number;
}

interface PageParams {
  examId: string;
}

export default function ParikshaExamPage({ params }: { params: Promise<PageParams> }) {
  const { examId } = use(params);
  const router = useRouter();

  const [phase, setPhase] = useState<'loading' | 'exam' | 'submitted' | 'error' | 'not_registered'>('loading');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [exam, setExam] = useState<ExamMeta | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [score, setScore] = useState<number | null>(null);
  const [total, setTotal] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetch(`/api/exams/${examId}/attempt`)
      .then(r => r.json())
      .then(data => {
        if (data.error === 'Unauthorized') { router.push('/login'); return; }
        if (data.error === 'Not registered for this exam') { setPhase('not_registered'); return; }
        if (data.error) { setErrorMsg(data.error); setPhase('error'); return; }
        if (data.submitted) {
          setScore(data.score);
          setTotal(data.total);
          setPhase('submitted');
          return;
        }
        setQuestions(data.questions ?? []);
        setExam(data.exam ?? null);
        setAnswers(data.attempt?.answers ?? {});
        setTimeRemaining((data.exam?.duration ?? 120) * 60);
        setPhase('exam');
      })
      .catch(() => { setErrorMsg('Network error'); setPhase('error'); });
  }, [examId, router]);

  // Countdown timer
  useEffect(() => {
    if (phase !== 'exam') return;
    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) { clearInterval(interval); handleSubmit(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/exams/${examId}/attempt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      });
      const data = await res.json();
      if (res.ok || data.message === 'Already submitted') {
        setScore(data.score);
        setTotal(data.total);
        setPhase('submitted');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        alert(data.error || 'Submission failed');
      }
    } catch {
      alert('Network error, please try again');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmSubmit = () => {
    const answered = Object.keys(answers).length;
    if (answered < questions.length) {
      if (!confirm(`You have ${questions.length - answered} unanswered questions. Submit anyway?`)) return;
    }
    handleSubmit();
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`;
  };

  if (phase === 'loading') {
    return (
      <><Header />
      <main className="grow pt-48 flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-neutral-200 border-t-neutral-900 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-neutral-500 text-sm uppercase tracking-[0.18em]">Loading exam…</p>
        </div>
      </main><Footer /></>
    );
  }

  if (phase === 'not_registered') {
    return (
      <><Header />
      <main className="grow pt-48 flex items-center justify-center bg-white">
        <div className="text-center max-w-md p-12 border border-neutral-200 rounded-3xl">
          <h2 className="font-display text-4xl text-neutral-900 mb-4">Not registered</h2>
          <p className="text-neutral-500 mb-8 text-sm">You need to register for this exam before you can take it.</p>
          <Button onClick={() => router.push('/pariksha')}>View exams</Button>
        </div>
      </main><Footer /></>
    );
  }

  if (phase === 'error') {
    return (
      <><Header />
      <main className="grow pt-48 flex items-center justify-center bg-white">
        <div className="text-center max-w-md p-12 border border-neutral-200 rounded-3xl">
          <h2 className="font-display text-4xl text-neutral-900 mb-4">Error</h2>
          <p className="text-rose-500 mb-8 text-sm">{errorMsg}</p>
          <Button onClick={() => router.push('/pariksha')}>Back to exams</Button>
        </div>
      </main><Footer /></>
    );
  }

  if (phase === 'submitted' && score !== null && total !== null) {
    const pct = Math.round((score / total) * 100);
    const passed = pct >= 70;
    return (
      <>
        <Header />
        <main className="grow pt-36 pb-24 bg-white">
          <div className="container mx-auto px-6">
            <div className="max-w-2xl mx-auto text-center border border-neutral-200 rounded-3xl p-10 md:p-16">
              <span className="text-[11px] uppercase tracking-[0.22em] text-neutral-500 font-medium flex items-center justify-center gap-2 mb-5">
                <span className="w-6 h-px bg-neutral-900" /> Exam complete
              </span>
              <h2 className="font-display text-4xl md:text-5xl text-neutral-900 mb-2 tracking-tight">{exam?.title}</h2>
              <p className="text-neutral-500 mb-10 text-sm">Your result</p>

              <div className="relative w-44 h-44 mx-auto mb-6">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="88" cy="88" r="72" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-neutral-100" />
                  <circle cx="88" cy="88" r="72" stroke="currentColor" strokeWidth="6" fill="transparent"
                    strokeDasharray={2 * Math.PI * 72}
                    strokeDashoffset={(2 * Math.PI * 72) * (1 - pct / 100)}
                    strokeLinecap="round"
                    className={`transition-all duration-1000 ${passed ? 'text-emerald-500' : pct >= 50 ? 'text-amber-500' : 'text-rose-500'}`}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-display text-5xl text-neutral-900 leading-none">{pct}%</span>
                  <span className="text-[10px] uppercase tracking-[0.22em] text-neutral-400 mt-2">{score}/{total}</span>
                </div>
              </div>

              <p className={`font-display text-4xl mb-2 ${passed ? 'text-emerald-600' : pct >= 50 ? 'text-amber-600' : 'text-rose-500'}`}>
                {passed ? 'Excellent.' : pct >= 50 ? 'Good effort.' : 'Keep practicing.'}
              </p>
              <p className="text-neutral-500 mb-10 text-sm">Passing score is 70%</p>

              <div className="flex gap-3 justify-center flex-wrap">
                <Button variant="primary" onClick={() => router.push('/pariksha')}>Back to exams</Button>
                <Button variant="secondary" onClick={() => router.push('/profile')}>View profile</Button>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const currentQ = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;

  return (
    <>
      <Header />
      <main className="grow pt-24 bg-white min-h-screen">
        {/* Top Bar */}
        <div className="sticky top-20 bg-white/90 backdrop-blur-xl border-b border-neutral-200 z-40 px-6 py-4">
          <div className="container mx-auto flex justify-between items-center">
            <div>
              <h1 className="font-display text-xl text-neutral-900 tracking-tight">{exam?.title}</h1>
              <span className="text-[11px] uppercase tracking-[0.22em] text-neutral-500 font-medium">{exam?.subject}</span>
            </div>
            <div className={`flex items-center gap-2 font-mono text-lg ${timeRemaining < 300 ? 'text-rose-600 animate-pulse' : 'text-neutral-700'}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeWidth="1.5" /><path d="M12 6v6l4 2" strokeWidth="1.5" strokeLinecap="round" /></svg>
              {formatTime(timeRemaining)}
            </div>
          </div>
        </div>

        <div className="container mx-auto px-6 py-12">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Question Panel */}
            <div className="grow">
              <div className="border border-neutral-200 rounded-3xl p-8 md:p-12">
                <div className="flex justify-between items-center mb-8">
                  <span className="text-[11px] uppercase tracking-[0.22em] text-neutral-500 font-medium">
                    Question {currentIndex + 1} of {questions.length}
                  </span>
                  <span className="px-3 py-1 bg-neutral-100 text-neutral-700 text-[10px] uppercase tracking-[0.18em] rounded-full font-medium">1 Mark</span>
                </div>

                {/* Progress bar */}
                <div className="mb-10">
                  <div className="h-px bg-neutral-200 overflow-hidden">
                    <div className="h-full bg-neutral-900 transition-all duration-500" style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }} />
                  </div>
                </div>

                <h2 className="font-display text-3xl md:text-4xl text-neutral-900 mb-10 leading-tight tracking-tight">{currentQ?.question}</h2>
                <div className="space-y-3 mb-12">
                  {currentQ?.options.map((opt, i) => {
                    const selected = answers[currentQ?.id] === i;
                    return (
                      <button
                        key={i}
                        onClick={() => setAnswers(prev => ({ ...prev, [currentQ.id]: i }))}
                        className={`group w-full flex items-center gap-5 p-5 rounded-2xl border transition-all text-left ${
                          selected ? 'border-neutral-900 bg-neutral-50' : 'border-neutral-200 bg-white hover:border-neutral-900'
                        }`}
                      >
                        <span className={`w-9 h-9 shrink-0 flex items-center justify-center rounded-lg font-medium text-sm transition-colors ${
                          selected ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-500'
                        }`}>
                          {String.fromCharCode(65 + i)}
                        </span>
                        <span className={`text-[15px] font-medium ${selected ? 'text-neutral-900' : 'text-neutral-700'}`}>{opt}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex justify-between items-center pt-8 border-t border-neutral-200">
                  <Button variant="secondary" onClick={() => setCurrentIndex(p => Math.max(0, p - 1))} disabled={currentIndex === 0}>← Previous</Button>
                  {currentIndex < questions.length - 1 ? (
                    <Button variant="primary" onClick={() => { setCurrentIndex(p => p + 1); window.scrollTo({top:0, behavior:'smooth'}); }}>Next →</Button>
                  ) : (
                    <Button variant="violet" onClick={confirmSubmit} disabled={submitting}>
                      {submitting ? 'Submitting…' : 'Submit exam'}
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar Palette */}
            <aside className="w-full lg:w-72 shrink-0">
              <div className="border border-neutral-200 rounded-3xl p-6 sticky top-44">
                <h3 className="text-[11px] uppercase tracking-[0.22em] text-neutral-500 font-medium flex items-center gap-2 mb-4">
                  <span className="w-6 h-px bg-neutral-900" /> Palette
                </h3>
                <p className="text-xs text-neutral-400 mb-6 font-mono">{answeredCount} / {questions.length} answered</p>
                <div className="grid grid-cols-5 gap-2 mb-6">
                  {questions.map((q, i) => (
                    <button key={i} onClick={() => setCurrentIndex(i)}
                      className={`w-10 h-10 rounded-lg border text-xs font-medium flex items-center justify-center transition-all hover:scale-105 ${
                        i === currentIndex ? 'bg-neutral-900 border-neutral-900 text-white' :
                        answers[q.id] !== undefined ? 'bg-emerald-500 border-emerald-500 text-white' :
                        'bg-neutral-50 text-neutral-400 border-neutral-200'
                      }`}
                    >{i + 1}</button>
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
      </main>
      <Footer />
    </>
  );
}
