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

interface AttemptData {
  id: string;
  answers: Record<string, number>;
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
    return (<><Header /><main className="flex-grow pt-48 flex items-center justify-center bg-neutral-50"><div className="text-center"><div className="w-12 h-12 border-4 border-violet border-t-transparent rounded-full animate-spin mx-auto mb-4" /><p className="text-neutral-500 font-medium">Loading exam...</p></div></main><Footer /></>);
  }

  if (phase === 'not_registered') {
    return (<><Header /><main className="flex-grow pt-48 flex items-center justify-center bg-neutral-50"><div className="text-center max-w-md p-12 bg-white rounded-[2.5rem] border border-neutral-100 shadow-xl"><p className="text-4xl mb-6">🔒</p><h2 className="text-2xl font-black mb-4">Not Registered</h2><p className="text-neutral-500 mb-8">You need to register for this exam before you can take it.</p><Button onClick={() => router.push('/pariksha')}>View Exams</Button></div></main><Footer /></>);
  }

  if (phase === 'error') {
    return (<><Header /><main className="flex-grow pt-48 flex items-center justify-center bg-neutral-50"><div className="text-center max-w-md p-12 bg-white rounded-[2.5rem] border border-neutral-100 shadow-xl"><p className="text-4xl mb-6">⚠️</p><h2 className="text-2xl font-black mb-4">Error</h2><p className="text-rose-500 mb-8">{errorMsg}</p><Button onClick={() => router.push('/pariksha')}>Back to Exams</Button></div></main><Footer /></>);
  }

  if (phase === 'submitted' && score !== null && total !== null) {
    const pct = Math.round((score / total) * 100);
    return (
      <>
        <Header />
        <main className="flex-grow pt-32 pb-24 bg-neutral-50">
          <div className="container mx-auto px-6">
            <div className="max-w-2xl mx-auto bg-white rounded-[2.5rem] border-2 border-neutral-100 shadow-2xl p-10 md:p-16 text-center">
              <p className="text-6xl mb-6">{pct >= 70 ? '🏆' : pct >= 50 ? '👍' : '📚'}</p>
              <h2 className="text-3xl font-black mb-2">{exam?.title}</h2>
              <p className="text-neutral-400 mb-10">Your result</p>

              <div className="relative w-44 h-44 mx-auto mb-6">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="88" cy="88" r="72" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-neutral-100" />
                  <circle cx="88" cy="88" r="72" stroke="currentColor" strokeWidth="12" fill="transparent"
                    strokeDasharray={2 * Math.PI * 72}
                    strokeDashoffset={(2 * Math.PI * 72) * (1 - pct / 100)}
                    strokeLinecap="round"
                    className={`transition-all duration-1000 ${pct >= 70 ? 'text-emerald-500' : pct >= 50 ? 'text-amber-500' : 'text-rose-500'}`}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-black text-neutral-900">{pct}%</span>
                  <span className="text-sm font-bold text-neutral-400">{score}/{total}</span>
                </div>
              </div>

              <p className={`text-2xl font-black mb-2 ${pct >= 70 ? 'text-emerald-600' : pct >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>
                {pct >= 70 ? 'Excellent!' : pct >= 50 ? 'Good Effort' : 'Keep Practicing'}
              </p>
              <p className="text-neutral-500 mb-10">Passing score is 70%</p>

              <div className="flex gap-4 justify-center flex-wrap">
                <Button variant="primary" onClick={() => router.push('/pariksha')}>Back to Exams</Button>
                <Button variant="secondary" onClick={() => router.push('/profile')}>View Profile</Button>
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
      <main className="flex-grow pt-24 bg-neutral-50 min-h-screen">
        {/* Top Bar */}
        <div className="sticky top-20 bg-white border-b border-neutral-100 z-40 px-6 py-4">
          <div className="container mx-auto flex justify-between items-center">
            <div>
              <h1 className="text-lg font-black text-neutral-900">{exam?.title}</h1>
              <span className="text-xs font-bold text-violet uppercase tracking-widest">{exam?.subject}</span>
            </div>
            <div className={`flex items-center gap-2 font-mono text-xl ${timeRemaining < 300 ? 'text-rose-600 animate-pulse' : 'text-neutral-500'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeWidth="2" /><path d="M12 6v6l4 2" strokeWidth="2" strokeLinecap="round" /></svg>
              {formatTime(timeRemaining)}
            </div>
          </div>
        </div>

        <div className="container mx-auto px-6 py-12">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Question Panel */}
            <div className="flex-grow">
              <div className="bg-white rounded-3xl border-2 border-neutral-100 p-8 md:p-12 shadow-sm">
                <div className="flex justify-between items-center mb-8">
                  <span className="text-sm font-bold text-neutral-400">Question {currentIndex + 1} of {questions.length}</span>
                  <span className="px-3 py-1 bg-neutral-100 text-neutral-500 text-xs font-bold rounded-full">1 Mark</span>
                </div>

                {/* Progress bar */}
                <div className="mb-8">
                  <div className="h-1.5 bg-neutral-100 rounded-full">
                    <div className="h-full bg-violet rounded-full transition-all" style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }} />
                  </div>
                </div>

                <h2 className="text-2xl font-bold text-neutral-900 mb-8 leading-tight">{currentQ?.question}</h2>
                <div className="grid gap-4 mb-12">
                  {currentQ?.options.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => setAnswers(prev => ({ ...prev, [currentQ.id]: i }))}
                      className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all text-left ${answers[currentQ?.id] === i ? 'border-violet bg-violet/5' : 'border-neutral-50 bg-neutral-50 hover:bg-neutral-100'}`}
                    >
                      <span className={`w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl font-bold ${answers[currentQ?.id] === i ? 'bg-violet text-white' : 'bg-white text-neutral-400'}`}>
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span className={`font-semibold ${answers[currentQ?.id] === i ? 'text-violet' : 'text-neutral-700'}`}>{opt}</span>
                    </button>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-8 border-t border-neutral-100">
                  <Button variant="secondary" onClick={() => setCurrentIndex(p => Math.max(0, p - 1))} disabled={currentIndex === 0}>← Previous</Button>
                  {currentIndex < questions.length - 1 ? (
                    <Button variant="primary" onClick={() => { setCurrentIndex(p => p + 1); window.scrollTo({top:0, behavior:'smooth'}); }}>Next →</Button>
                  ) : (
                    <Button variant="violet" onClick={confirmSubmit} disabled={submitting}>
                      {submitting ? 'Submitting...' : 'Submit Exam'}
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar Palette */}
            <aside className="w-full lg:w-72 flex-shrink-0">
              <div className="bg-white rounded-3xl border-2 border-neutral-100 p-6 sticky top-44">
                <h3 className="text-sm font-black text-neutral-900 uppercase tracking-widest mb-4">Question Palette</h3>
                <p className="text-xs text-neutral-400 font-medium mb-6">{answeredCount} of {questions.length} answered</p>
                <div className="grid grid-cols-5 gap-2 mb-8">
                  {questions.map((q, i) => (
                    <button key={i} onClick={() => setCurrentIndex(i)}
                      className={`w-10 h-10 rounded-xl border-2 text-xs flex items-center justify-center transition-all font-bold ${
                        i === currentIndex ? 'bg-white border-violet text-violet ring-2 ring-violet/20' :
                        answers[q.id] !== undefined ? 'bg-emerald-500 border-emerald-500 text-white' :
                        'bg-neutral-50 text-neutral-400 border-neutral-50 hover:bg-neutral-100'
                      }`}
                    >{i + 1}</button>
                  ))}
                </div>
                <div className="space-y-2 pt-4 border-t border-neutral-100 mb-6 text-xs font-bold text-neutral-500">
                  <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-emerald-500" /> Answered</div>
                  <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-neutral-100 border border-neutral-200" /> Not answered</div>
                </div>
                <Button variant="violet" className="w-full" onClick={confirmSubmit} disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Exam'}
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
