'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import type { DgcaCourse, DgcaSubject, DgcaChapter, DgcaQuestion } from '@/lib/types';
import { DgcaResultReview } from './_components/DgcaResultReview';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Layers,
  Lock,
  Loader2,
  PlayCircle,
} from 'lucide-react';

// ── Razorpay checkout typings (matches the Pariksha register flow) ──────────
interface RazorpayCheckoutOptions {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  name: string;
  description: string;
  theme?: { color?: string };
  handler: (resp: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => void;
  modal?: { ondismiss?: () => void };
}
interface RazorpayInstance { open: () => void }
type RazorpayCtor = new (opts: RazorpayCheckoutOptions) => RazorpayInstance;

// Accessed via cast rather than a `declare global` Window augmentation, because
// another page already augments Window.Razorpay and duplicate augmentations with
// distinct local option types conflict under tsc.
const getRazorpay = (): RazorpayCtor | undefined =>
  typeof window !== 'undefined'
    ? (window as unknown as { Razorpay?: RazorpayCtor }).Razorpay
    : undefined;

type View = 'courses' | 'subjects' | 'chapters' | 'practice' | 'results';

export default function DGCAPage() {
  const toast = useToast();

  const [view, setView] = useState<View>('courses');
  const [courses, setCourses] = useState<DgcaCourse[]>([]);
  const [subjects, setSubjects] = useState<DgcaSubject[]>([]);
  const [chapters, setChapters] = useState<DgcaChapter[]>([]);
  const [questions, setQuestions] = useState<DgcaQuestion[]>([]);

  const [course, setCourse] = useState<DgcaCourse | null>(null);
  const [subject, setSubject] = useState<DgcaSubject | null>(null);
  const [chapter, setChapter] = useState<DgcaChapter | null>(null);

  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState<string | null>(null);
  const [sdkReady, setSdkReady] = useState(false);

  // Practice state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);

  // ── Razorpay SDK ──
  useEffect(() => {
    const URL = 'https://checkout.razorpay.com/v1/checkout.js';
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${URL}"]`);
    if (existing) {
      if (getRazorpay()) setSdkReady(true);
      else existing.addEventListener('load', () => setSdkReady(true), { once: true });
      return;
    }
    const script = document.createElement('script');
    script.src = URL;
    script.async = true;
    script.onload = () => setSdkReady(true);
    document.body.appendChild(script);
  }, []);

  // ── Initial load: courses ──
  const loadCourses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/dgca/courses');
      const data = await res.json();
      setCourses(data.courses ?? []);
    } catch {
      toast.error('Failed to load courses. Please refresh.');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { void loadCourses(); }, [loadCourses]);

  // ── Content protection ──
  // These questions are exclusive to Pilot Note and not available anywhere else.
  // While practising/reviewing, block copy, cut, paste, right-click, drag, text
  // selection and the common save/print/devtools shortcuts. Selection + image
  // drag are also disabled via the `.exam-lockdown` CSS class on <main>.
  useEffect(() => {
    if (view !== 'practice' && view !== 'results') return;
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
  }, [view]);

  const goCourses = () => { setView('courses'); setCourse(null); setSubject(null); setChapter(null); scrollTop(); };

  const pickCourse = async (c: DgcaCourse) => {
    setCourse(c);
    setView('subjects');
    setSubjects([]); // avoid showing a sibling course's subjects if this fetch fails
    setLoading(true);
    scrollTop();
    try {
      const res = await fetch(`/api/dgca/subjects?courseId=${encodeURIComponent(c.id)}`);
      const data = await res.json();
      setSubjects(data.subjects ?? []);
    } catch {
      toast.error('Failed to load subjects.');
    } finally {
      setLoading(false);
    }
  };

  const pickSubject = async (s: DgcaSubject) => {
    setSubject(s);
    setView('chapters');
    setChapters([]); // avoid showing a sibling subject's chapters if this fetch fails
    setLoading(true);
    scrollTop();
    try {
      const res = await fetch(`/api/dgca/chapters?subjectId=${encodeURIComponent(s.id)}`);
      const data = await res.json();
      setChapters(data.chapters ?? []);
    } catch {
      toast.error('Failed to load chapters.');
    } finally {
      setLoading(false);
    }
  };

  const startPractice = useCallback(async (ch: DgcaChapter) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dgca/chapters/${ch.id}/questions`);
      if (res.status === 401) {
        window.location.href = `/login?redirect=${encodeURIComponent('/dgca')}`;
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error ?? 'Could not load this chapter.');
        setLoading(false);
        return;
      }
      const qs: DgcaQuestion[] = data.questions ?? [];
      if (qs.length === 0) {
        toast.info('No questions in this chapter yet. Check back soon.');
        setLoading(false);
        return;
      }
      setChapter(ch);
      setQuestions(qs);
      setAnswers(new Array(qs.length).fill(null));
      setCurrentIndex(0);
      setView('practice');
      scrollTop();
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const handleFinish = useCallback(() => {
    if (chapter) {
      const score = questions.reduce((acc, q, i) => acc + (answers[i] === q.correct ? (q.marks ?? 1) : 0), 0);
      const total = questions.reduce((acc, q) => acc + (q.marks ?? 1), 0);
      fetch(`/api/dgca/chapters/${chapter.id}/results`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score, total, answers }),
      }).catch(() => {});
    }
    setView('results');
    scrollTop();
  }, [chapter, questions, answers]);

  const startCheckout = useCallback(async (ch: DgcaChapter) => {
    if (paying) return;
    setPaying(ch.id);
    try {
      const orderRes = await fetch(`/api/dgca/chapters/${ch.id}/payment/create-order`, { method: 'POST' });
      if (orderRes.status === 401) {
        window.location.href = '/login?redirect=/dgca';
        return;
      }
      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        toast.error(orderData?.error ?? 'Could not start payment.');
        setPaying(null);
        return;
      }
      // Already free/owned (e.g. price changed) — just start practising.
      if (orderData.free || orderData.alreadyOwned) {
        setPaying(null);
        await startPractice({ ...ch, isOwned: true });
        return;
      }
      const Razorpay = getRazorpay();
      if (!sdkReady || !Razorpay) {
        toast.warn('Payment is still loading — try again in a moment.');
        setPaying(null);
        return;
      }
      const rz = new Razorpay({
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        order_id: orderData.order_id,
        name: 'Pilot Note',
        description: orderData.chapter_title ?? ch.title,
        theme: { color: '#10b981' },
        handler: async (resp) => {
          try {
            const verifyRes = await fetch(`/api/dgca/chapters/${ch.id}/payment/verify`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(resp),
            });
            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) {
              toast.error(verifyData?.error ?? 'Payment verification failed.');
              setPaying(null);
              return;
            }
            toast.success('Unlocked! Starting practice.');
            setChapters((prev) => prev.map((c) => (c.id === ch.id ? { ...c, isOwned: true } : c)));
            setPaying(null);
            await startPractice({ ...ch, isOwned: true });
          } catch {
            toast.error('Verification network error — contact support.');
            setPaying(null);
          }
        },
        modal: {
          ondismiss: () => {
            setPaying(null);
            toast.info('Payment cancelled.');
          },
        },
      });
      rz.open();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Unknown error');
      setPaying(null);
    }
  }, [paying, sdkReady, startPractice, toast]);

  return (
    <>
      <Header />
      <main className={`grow pt-28 sm:pt-32 lg:pt-36 pb-16 sm:pb-24 lg:pb-32 bg-white min-h-screen${view === 'practice' || view === 'results' ? ' exam-lockdown' : ''}`}>
        <div className="container mx-auto px-4 sm:px-6">
          {/* Breadcrumb */}
          {view !== 'courses' && (
            <nav className="flex flex-wrap items-center gap-1.5 text-[12px] sm:text-[13px] text-neutral-500 mb-8 sm:mb-10">
              <button onClick={goCourses} className="hover:text-neutral-900 transition-colors">DGCA</button>
              {course && (
                <>
                  <ChevronRight className="w-3.5 h-3.5 text-neutral-300" />
                  <button onClick={() => pickCourse(course)} className="hover:text-neutral-900 transition-colors">{course.name}</button>
                </>
              )}
              {subject && (view === 'chapters' || view === 'practice' || view === 'results') && (
                <>
                  <ChevronRight className="w-3.5 h-3.5 text-neutral-300" />
                  <button onClick={() => pickSubject(subject)} className="hover:text-neutral-900 transition-colors">{subject.name}</button>
                </>
              )}
              {chapter && (view === 'practice' || view === 'results') && (
                <>
                  <ChevronRight className="w-3.5 h-3.5 text-neutral-300" />
                  <span className="text-neutral-900 font-medium">{chapter.title}</span>
                </>
              )}
            </nav>
          )}

          {view === 'courses' && <CoursesView courses={courses} loading={loading} onPick={pickCourse} />}
          {view === 'subjects' && course && (
            <SubjectsView course={course} subjects={subjects} loading={loading} onBack={goCourses} onPick={pickSubject} />
          )}
          {view === 'chapters' && subject && (
            <ChaptersView
              subject={subject}
              chapters={chapters}
              loading={loading}
              paying={paying}
              onBack={() => course && pickCourse(course)}
              onPractice={startPractice}
              onUnlock={startCheckout}
            />
          )}
          {view === 'practice' && chapter && (
            <PracticeView
              chapter={chapter}
              questions={questions}
              currentIndex={currentIndex}
              answers={answers}
              onAnswer={(i) => {
                if (answers[currentIndex] !== null) return;
                setAnswers((prev) => prev.map((a, idx) => (idx === currentIndex ? i : a)));
              }}
              onPrev={() => { setCurrentIndex((p) => Math.max(0, p - 1)); scrollTop(); }}
              onNext={() => { setCurrentIndex((p) => Math.min(questions.length - 1, p + 1)); scrollTop(); }}
              onJump={(i) => { setCurrentIndex(i); scrollTop(); }}
              onFinish={handleFinish}
              onExit={() => subject && pickSubject(subject)}
            />
          )}
          {view === 'results' && chapter && (
            <ResultsView
              chapter={chapter}
              subjectName={subject?.name ?? null}
              questions={questions}
              answers={answers}
              onRetry={() => { setAnswers(new Array(questions.length).fill(null)); setCurrentIndex(0); setView('practice'); scrollTop(); }}
              onBack={() => subject && pickSubject(subject)}
            />
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

function scrollTop() {
  if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ─────────────────────────── Courses ───────────────────────────
function CoursesView({ courses, loading, onPick }: { courses: DgcaCourse[]; loading: boolean; onPick: (c: DgcaCourse) => void }) {
  return (
    <div>
      <div className="grid lg:grid-cols-12 gap-8 lg:gap-10 mb-10 sm:mb-16 items-end">
        <div className="lg:col-span-8">
          <span className="text-[11px] uppercase tracking-[0.22em] text-neutral-500 font-medium flex items-center gap-2 mb-4 sm:mb-6">
            <span className="w-6 h-px bg-neutral-900" />
            DGCA Ground Subjects
          </span>
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-[1.02] tracking-[-0.03em] text-neutral-900">
            Chapter-Wise DGCA CPL &amp; ATPL <span className="italic-serif">Practice.</span>
          </h1>
        </div>
        <div className="lg:col-span-4">
          <p className="text-neutral-600 text-sm sm:text-base leading-relaxed">
            Master every chapter with our extensive collection of highly unique MCQs designed to cover
            the complete syllabus. Each chapter contains 150+ carefully crafted questions that test
            concepts from every angle, making it a powerful revision tool before your exams. Unlike
            traditional question banks, our questions are original and not copied from any book-back
            questions, helping you build genuine understanding and exam readiness.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          {[1, 2].map((i) => <div key={i} className="h-56 skeleton rounded-3xl" />)}
        </div>
      ) : courses.length === 0 ? (
        <EmptyState icon={<Layers className="w-10 h-10" strokeWidth={1.5} />} text="No courses published yet. Check back soon." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          {courses.map((c) => (
            <button
              key={c.id}
              onClick={() => onPick(c)}
              className="group bg-white border border-neutral-200 rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10 text-left transition-all duration-300 hover:border-neutral-900 hover:shadow-[0_24px_48px_-24px_rgba(10,10,10,0.18)] flex flex-col min-h-56"
            >
              <div className="flex items-center mb-10 sm:mb-14">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-neutral-100 group-hover:bg-emerald-500 group-hover:text-white text-neutral-900 flex items-center justify-center transition-colors">
                  <BookOpen className="w-5 h-5" strokeWidth={1.5} />
                </div>
              </div>
              <h3 className="font-display text-3xl sm:text-4xl text-neutral-900 mb-2 leading-tight">{c.name}</h3>
              <div className="mt-auto flex items-center justify-between pt-5 sm:pt-6 border-t border-neutral-100">
                <span className="text-[11px] uppercase tracking-[0.18em] text-neutral-400 font-medium">
                  {c.subject_count ?? 0} subject{(c.subject_count ?? 0) === 1 ? '' : 's'}
                </span>
                <span className="text-sm font-medium text-neutral-900 flex items-center gap-2 link-underline">
                  Open <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────── Subjects ───────────────────────────
function SubjectsView({ course, subjects, loading, onBack, onPick }: {
  course: DgcaCourse; subjects: DgcaSubject[]; loading: boolean; onBack: () => void; onPick: (s: DgcaSubject) => void;
}) {
  return (
    <div>
      <BackLink onClick={onBack} label="All courses" />
      <h2 className="font-display text-3xl sm:text-4xl md:text-5xl text-neutral-900 mb-8 sm:mb-12 tracking-tight">
        {course.name} <span className="italic-serif text-neutral-400">subjects.</span>
      </h2>
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[1, 2, 3].map((i) => <div key={i} className="h-40 skeleton rounded-2xl" />)}
        </div>
      ) : subjects.length === 0 ? (
        <EmptyState icon={<Layers className="w-10 h-10" strokeWidth={1.5} />} text="No subjects in this course yet." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {subjects.map((s) => (
            <button
              key={s.id}
              onClick={() => onPick(s)}
              className="group bg-white border border-neutral-200 rounded-2xl p-6 text-left transition-all duration-300 hover:border-neutral-900 hover:shadow-[0_24px_48px_-24px_rgba(10,10,10,0.18)] flex flex-col"
            >
              <h3 className="font-display text-xl sm:text-2xl text-neutral-900 mb-4 leading-tight">{s.name}</h3>
              <div className="mt-auto flex items-center justify-between pt-4 border-t border-neutral-100">
                <span className="text-[11px] uppercase tracking-[0.18em] text-neutral-400 font-medium">
                  {s.chapter_count ?? 0} chapter{(s.chapter_count ?? 0) === 1 ? '' : 's'}
                </span>
                <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-neutral-900 group-hover:translate-x-0.5 transition-all" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────── Chapters ───────────────────────────
function ChaptersView({ subject, chapters, loading, paying, onBack, onPractice, onUnlock }: {
  subject: DgcaSubject;
  chapters: DgcaChapter[];
  loading: boolean;
  paying: string | null;
  onBack: () => void;
  onPractice: (c: DgcaChapter) => void;
  onUnlock: (c: DgcaChapter) => void;
}) {
  return (
    <div>
      <BackLink onClick={onBack} label="All subjects" />
      <h2 className="font-display text-3xl sm:text-4xl md:text-5xl text-neutral-900 mb-8 sm:mb-12 tracking-tight">
        {subject.name} <span className="italic-serif text-neutral-400">chapters.</span>
      </h2>
      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-24 skeleton rounded-2xl" />)}</div>
      ) : chapters.length === 0 ? (
        <EmptyState icon={<BookOpen className="w-10 h-10" strokeWidth={1.5} />} text="No chapters in this subject yet. Check back soon." />
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {chapters.map((c, idx) => {
            const free = c.price === 0;
            const owned = !!c.isOwned;
            const locked = !free && !owned;
            return (
              <div
                key={c.id}
                className="group bg-white border border-neutral-200 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 hover:border-neutral-900 hover:shadow-[0_24px_48px_-24px_rgba(10,10,10,0.18)] transition-all duration-300"
              >
                <span className="font-display text-3xl sm:text-4xl text-neutral-200 leading-none w-12 shrink-0">
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-display text-lg sm:text-xl text-neutral-900 leading-tight">{c.title}</h3>
                    {free ? (
                      <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 font-bold">Free</span>
                    ) : owned ? (
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 font-bold">
                        <CheckCircle2 className="w-3 h-3" /> Unlocked
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 border border-neutral-200 font-bold">
                        <Lock className="w-3 h-3" /> ₹{c.price}
                      </span>
                    )}
                  </div>
                  {c.description && <p className="text-sm text-neutral-500 leading-relaxed line-clamp-2">{c.description}</p>}
                  <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-400 font-mono mt-1.5">
                    {c.question_count ?? 0} question{(c.question_count ?? 0) === 1 ? '' : 's'}
                  </p>
                </div>
                <div className="shrink-0">
                  {locked ? (
                    <Button size="sm" variant="primary" onClick={() => onUnlock(c)} disabled={paying === c.id}>
                      {paying === c.id ? (<><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>) : (<>Unlock ₹{c.price} <ArrowRight className="w-4 h-4" /></>)}
                    </Button>
                  ) : (
                    <Button size="sm" variant="violet" onClick={() => onPractice(c)}>
                      <PlayCircle className="w-4 h-4" /> Practice
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────── Practice ───────────────────────────
function PracticeView({ chapter, questions, currentIndex, answers, onAnswer, onPrev, onNext, onJump, onFinish, onExit }: {
  chapter: DgcaChapter;
  questions: DgcaQuestion[];
  currentIndex: number;
  answers: (number | null)[];
  onAnswer: (i: number) => void;
  onPrev: () => void;
  onNext: () => void;
  onJump: (i: number) => void;
  onFinish: () => void;
  onExit: () => void;
}) {
  const q = questions[currentIndex];
  const answered = answers[currentIndex] !== null;
  const isLast = currentIndex === questions.length - 1;
  const answeredCount = answers.filter((a) => a !== null).length;

  const paletteCells = questions.map((qq, i) => {
    const ans = answers[i];
    const done = ans !== null;
    const correct = done && ans === qq.correct;
    const isCurrent = i === currentIndex;
    let cls = 'bg-white border-neutral-200 text-neutral-600 hover:border-neutral-900';
    if (done) {
      cls = correct
        ? 'bg-emerald-500 border-emerald-500 text-white'
        : 'bg-rose-500 border-rose-500 text-white';
    }
    return (
      <button
        key={qq.id}
        onClick={() => onJump(i)}
        aria-label={`Go to question ${i + 1}`}
        aria-current={isCurrent ? 'true' : undefined}
        className={`aspect-square flex items-center justify-center text-xs font-medium rounded-lg border transition-all ${cls} ${isCurrent ? 'ring-2 ring-offset-1 ring-neutral-900' : ''}`}
      >
        {i + 1}
      </button>
    );
  });

  const paletteLegend = (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-4 text-[11px] text-neutral-500">
      <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-500 inline-block" /> Correct</span>
      <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-rose-500 inline-block" /> Incorrect</span>
      <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded border border-neutral-300 bg-white inline-block" /> Unanswered</span>
    </div>
  );

  return (
    <div className="flex gap-8 items-start">
      {/* Main question panel */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-6 sm:mb-10 gap-3">
          <span className="text-[11px] uppercase tracking-[0.22em] text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2.5 py-1 sm:px-3 rounded-full font-medium truncate">
            {chapter.title}
          </span>
          <button onClick={onExit} className="text-xs text-neutral-500 hover:text-neutral-900 transition-colors shrink-0">Exit</button>
        </div>

        <div className="mb-6 sm:mb-10">
          <div className="flex justify-between text-xs font-medium text-neutral-500 mb-3 tracking-wide">
            <span className="flex items-center gap-2">
              Question {currentIndex + 1} of {questions.length}
              <span className="text-violet-700 bg-violet-50 border border-violet-200/60 px-2 py-0.5 rounded-full font-bold">
                {q?.marks ?? 1} mark{(q?.marks ?? 1) === 1 ? '' : 's'}
              </span>
            </span>
            <span>{answeredCount} answered</span>
          </div>
          <div className="h-px bg-neutral-200 overflow-hidden">
            <div className="h-full bg-neutral-900 transition-all duration-500" style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }} />
          </div>
        </div>

        {q?.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={q.image_url} alt="diagram" className="max-h-64 w-auto mb-6 rounded-2xl border border-neutral-200 object-contain" />
        )}

        <h2 className="font-display text-2xl sm:text-3xl md:text-4xl text-neutral-900 leading-tight tracking-tight mb-6 sm:mb-10">
          {q?.question}
        </h2>

        <div className="space-y-2.5 sm:space-y-3 mb-6 sm:mb-8">
          {q?.options.map((opt, i) => {
            const isSelected = answers[currentIndex] === i;
            const isCorrect = q.correct === i;
            let cls = 'border-neutral-200 hover:border-neutral-900 bg-white';
            let letterCls = 'bg-neutral-100 text-neutral-500';
            if (answered) {
              if (isCorrect) { cls = 'border-emerald-500 bg-emerald-50/50'; letterCls = 'bg-emerald-500 text-white'; }
              else if (isSelected) { cls = 'border-rose-400 bg-rose-50/50'; letterCls = 'bg-rose-500 text-white'; }
            } else if (isSelected) { cls = 'border-neutral-900 bg-neutral-50'; letterCls = 'bg-neutral-900 text-white'; }
            return (
              <button
                key={i}
                onClick={() => onAnswer(i)}
                disabled={answered}
                className={`group w-full flex items-start sm:items-center gap-3 sm:gap-5 p-3.5 sm:p-5 rounded-2xl border transition-all text-left ${cls}`}
              >
                <span className={`w-8 h-8 sm:w-9 sm:h-9 shrink-0 flex items-center justify-center rounded-lg font-medium text-xs sm:text-sm transition-colors ${letterCls}`}>
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="text-sm sm:text-[15px] font-medium leading-relaxed text-neutral-800">{opt}</span>
              </button>
            );
          })}
        </div>

        {answered && q?.explanation && (
          <div className="mb-6 sm:mb-8 p-4 sm:p-5 border-l-2 border-emerald-500 bg-emerald-50/40 rounded-r-xl">
            <p className="text-[11px] uppercase tracking-[0.22em] text-emerald-700 font-medium mb-2">Explanation</p>
            <p className="text-neutral-700 text-sm sm:text-[15px] leading-relaxed">{q.explanation}</p>
          </div>
        )}

        <div className="flex flex-col-reverse sm:flex-row sm:justify-between sm:items-center gap-3 pt-6 sm:pt-8 border-t border-neutral-200">
          <Button variant="secondary" onClick={onPrev} disabled={currentIndex === 0} className="w-full sm:w-auto">
            <ArrowLeft className="w-4 h-4" /> Previous
          </Button>
          {isLast ? (
            <Button variant="violet" onClick={onFinish} className="w-full sm:w-auto">Finish</Button>
          ) : (
            <Button variant="primary" onClick={onNext} className="w-full sm:w-auto">Next <ArrowRight className="w-4 h-4" /></Button>
          )}
        </div>

        {/* Question palette — mobile only (below nav buttons) */}
        <div className="lg:hidden mt-6 sm:mt-8 pt-6 border-t border-neutral-200">
          <div className="flex items-center justify-between mb-3.5">
            <p className="text-[11px] uppercase tracking-[0.22em] text-neutral-400 font-medium">Question palette</p>
            <span className="text-[11px] text-neutral-400 font-mono">{answeredCount}/{questions.length}</span>
          </div>
          <div className="grid grid-cols-8 sm:grid-cols-10 gap-1.5 sm:gap-2">
            {paletteCells}
          </div>
          {paletteLegend}
        </div>
      </div>

      {/* Question palette — desktop sidebar */}
      <aside className="hidden lg:block w-80 shrink-0 sticky top-32">
        <div className="border border-neutral-200 rounded-3xl p-5 bg-white">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[11px] uppercase tracking-[0.22em] text-neutral-400 font-medium">Question palette</p>
            <span className="text-[11px] text-neutral-400 font-mono">{answeredCount}/{questions.length}</span>
          </div>
          <div className="grid grid-cols-10 gap-1.5">
            {paletteCells}
          </div>
          {paletteLegend}
        </div>
      </aside>
    </div>
  );
}

// ─────────────────────────── Results ───────────────────────────
function ResultsView({ chapter, subjectName, questions, answers, onRetry, onBack }: {
  chapter: DgcaChapter;
  subjectName: string | null;
  questions: DgcaQuestion[];
  answers: (number | null)[];
  onRetry: () => void;
  onBack: () => void;
}) {
  return (
    <div className="max-w-3xl mx-auto">
      <DgcaResultReview
        chapterTitle={chapter.title}
        subjectName={subjectName}
        questions={questions}
        answers={answers}
      />
      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 mt-10 sm:mt-12">
        <Button variant="primary" size="lg" onClick={onRetry} className="justify-center">Practice again</Button>
        <Button variant="secondary" size="lg" onClick={onBack} className="justify-center">Back to chapters</Button>
      </div>
    </div>
  );
}

// ─────────────────────────── Shared bits ───────────────────────────
function BackLink({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button onClick={onClick} className="group inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-900 mb-8 transition-colors">
      <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" /> {label}
    </button>
  );
}

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="border border-neutral-200 rounded-3xl py-24 text-center">
      <div className="text-neutral-300 mx-auto mb-4 w-fit">{icon}</div>
      <p className="text-neutral-500">{text}</p>
    </div>
  );
}
