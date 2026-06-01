"use client";

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Users, Calendar, Clock, FileText, ArrowRight, Trophy } from 'lucide-react';
import { computeExamStatus } from '@/lib/exam-status';
import type { ParikshaTopper } from '@/lib/types';

interface Exam {
  id: string;
  title: string;
  subject: string;
  description: string;
  exam_date: string;
  exam_time: string;
  duration: number;
  total_questions: number;
  fee: number;
  original_fee?: number | null;
  status: string;
  start_at: string | null;
  end_at: string | null;
  registrations: number;
  isRegistered: boolean;
  hasAttempted: boolean;
}

const STATUS_BADGE: Record<string, string> = {
  Upcoming: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
  Active: 'bg-amber-50 text-amber-700 border-amber-200/60',
  Live: 'bg-amber-50 text-amber-700 border-amber-200/60',
  Completed: 'bg-neutral-100 text-neutral-500 border-neutral-200/60',
  Cancelled: 'bg-rose-50 text-rose-700 border-rose-200/60',
};

export default function ParikshaPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toppers, setToppers] = useState<ParikshaTopper[]>([]);
  // Tick once a minute so status badges flip from Upcoming → Active → Completed
  // without the user having to refresh.
  const [, setNowTick] = useState(0);

  const fetchExams = async () => {
    try {
      const res = await fetch('/api/exams');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setExams(data.exams ?? []);
    } catch {
      setError('Failed to load exams. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchExams(); }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/leaderboard');
        if (res.ok) {
          const data = await res.json();
          setToppers(data.toppers ?? []);
        }
      } catch { /* leaderboard is non-critical */ }
    })();
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNowTick((n) => n + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
    });

  return (
    <>
      <Header />
      <main className="grow pt-28 sm:pt-36 pb-20 sm:pb-32 bg-white">
        {/* ───── Hero ───── */}
        <section className="container mx-auto px-4 sm:px-6 mb-12 sm:mb-20">
          <div className="grid lg:grid-cols-12 gap-6 sm:gap-10 items-end">
            <div className="lg:col-span-8">
              <span className="text-[11px] uppercase tracking-[0.22em] text-neutral-500 font-medium flex items-center gap-2 mb-5 sm:mb-6">
                <span className="w-6 h-px bg-neutral-900" />
                Pariksha · All India Mock Exams
              </span>
              <h1 className="font-display text-4xl sm:text-5xl md:text-7xl lg:text-8xl leading-[1.02] sm:leading-[0.95] tracking-[-0.03em] text-neutral-900">
                Real exam.
                <br />
                <span className="italic-serif">Real</span> competition.
              </h1>
            </div>
            <div className="lg:col-span-4">
              <p className="text-neutral-600 text-base sm:text-lg leading-relaxed mb-5 sm:mb-6">
                All-India mock examinations for CPL subjects. Compete with students nationwide — like
                JEE, but for pilots.
              </p>
              <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-neutral-500">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 pulse-dot" /> Next mock
                </span>
                <span className="w-1 h-1 rounded-full bg-neutral-300" />
                <span className="text-neutral-900 font-medium">Apr 15, 2026</span>
              </div>
            </div>
          </div>
        </section>

        {/* ───── Exams list ───── */}
        <section className="container mx-auto px-4 sm:px-6">
          {loading ? (
            <div className="space-y-6 lg:space-y-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white border border-neutral-200 rounded-3xl p-8 flex gap-6">
                  <div className="w-14 h-14 skeleton rounded-2xl shrink-0" />
                  <div className="flex-1 space-y-3">
                    <div className="h-6 skeleton rounded w-2/3" />
                    <div className="h-4 skeleton rounded w-full" />
                    <div className="h-4 skeleton rounded w-4/5" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-24">
              <p className="text-rose-500 font-medium">{error}</p>
            </div>
          ) : exams.length === 0 ? (
            <div className="border border-neutral-200 rounded-3xl py-24 text-center">
              <Calendar className="w-10 h-10 text-neutral-300 mx-auto mb-4" strokeWidth={1.5} />
              <p className="text-neutral-500">No exams scheduled yet. Check back soon.</p>
            </div>
          ) : (
            <div className="space-y-6 lg:space-y-8">
              {exams.map((exam, idx) => {
                const liveStatus = computeExamStatus(exam);
                const statusLabel = liveStatus === 'Active' ? 'Live' : liveStatus;
                const statusClass = STATUS_BADGE[statusLabel] || STATUS_BADGE.Upcoming;
                return (
                  <div
                    key={exam.id}
                    className="bg-white border border-neutral-200 rounded-3xl p-5 sm:p-8 lg:p-10 group hover:border-neutral-900 hover:shadow-[0_24px_48px_-24px_rgba(10,10,10,0.18)] transition-all duration-300"
                  >
                    <div className="grid lg:grid-cols-12 gap-5 sm:gap-8 items-start">
                      {/* Left — meta */}
                      <div className="hidden lg:block lg:col-span-1">
                        <span className="text-[11px] tracking-[0.22em] uppercase text-neutral-400 font-mono">
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                      </div>

                      {/* Middle — content */}
                      <div className="lg:col-span-7">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 mb-3 sm:mb-4">
                          <span className={`px-2.5 py-0.5 sm:px-3 sm:py-1 text-[10px] font-medium uppercase tracking-[0.18em] rounded-full border ${statusClass}`}>
                            {statusLabel}
                          </span>
                          <span className="text-[11px] uppercase tracking-[0.18em] text-neutral-500 font-medium">
                            {exam.subject}
                          </span>
                        </div>
                        <h3 className="font-display text-2xl sm:text-3xl md:text-4xl text-neutral-900 mb-3 sm:mb-4 leading-tight">
                          {exam.title}
                        </h3>
                        <p className="text-neutral-600 text-sm sm:text-[15px] leading-relaxed mb-5 sm:mb-6 max-w-2xl">
                          {exam.description}
                        </p>

                        {/* Meta strip */}
                        <div className="flex flex-wrap items-center gap-x-5 sm:gap-x-8 gap-y-2.5 sm:gap-y-3 text-[13px] sm:text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-neutral-400" strokeWidth={1.5} />
                            <span className="text-neutral-900 font-medium">{formatDate(exam.exam_date)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-neutral-400" strokeWidth={1.5} />
                            <span className="text-neutral-900 font-medium">{exam.exam_time} IST</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-neutral-400" strokeWidth={1.5} />
                            <span className="text-neutral-900 font-medium">{exam.total_questions} Qs · {exam.duration} min</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-neutral-400" strokeWidth={1.5} />
                            <span className="text-neutral-900 font-medium">{exam.registrations} registered</span>
                          </div>
                        </div>
                      </div>

                      {/* Right — action */}
                      <div className="lg:col-span-4 lg:text-right border-t lg:border-t-0 lg:border-l border-neutral-200/70 pt-5 lg:pt-0 lg:pl-6">
                        <div className="flex lg:block items-end justify-between mb-4 sm:mb-5">
                          <div>
                            {exam.fee === 0 ? (
                              <div className="flex items-baseline gap-2 lg:justify-end flex-wrap">
                                <p className="font-display text-3xl sm:text-4xl text-emerald-600 leading-none tracking-tight">Free</p>
                                {exam.original_fee && exam.original_fee > 0 ? (
                                  <span className="text-sm text-neutral-400 line-through">₹{exam.original_fee}</span>
                                ) : null}
                              </div>
                            ) : exam.original_fee && exam.original_fee > exam.fee ? (
                              <div className="flex items-baseline gap-2 lg:justify-end flex-wrap">
                                <p className="font-display text-3xl sm:text-4xl text-neutral-900 leading-none tracking-tight">
                                  ₹{exam.fee}
                                </p>
                                <span className="text-sm text-neutral-400 line-through">₹{exam.original_fee}</span>
                                <span className="px-1.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold uppercase tracking-wider">
                                  -{Math.round(((exam.original_fee - exam.fee) / exam.original_fee) * 100)}%
                                </span>
                              </div>
                            ) : (
                              <p className="font-display text-3xl sm:text-4xl text-neutral-900 leading-none tracking-tight">
                                ₹{exam.fee}
                              </p>
                            )}
                            <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.18em] text-neutral-400 mt-2">
                              {exam.fee === 0 ? 'No payment required' : 'Per attempt'}
                            </p>
                          </div>
                        </div>

                        <div className="w-full lg:w-auto inline-block">
                          {exam.hasAttempted ? (
                            <Button variant="secondary" size="md" href={`/pariksha/${exam.id}/results`} className="w-full lg:w-auto">
                              View results <ArrowRight className="w-4 h-4" />
                            </Button>
                          ) : exam.isRegistered ? (
                            <Button variant="violet" size="md" href={`/pariksha/${exam.id}`} className="w-full lg:w-auto">
                              Enter exam <ArrowRight className="w-4 h-4" />
                            </Button>
                          ) : liveStatus === 'Completed' ? (
                            <Button size="md" disabled className="w-full lg:w-auto">
                              Exam ended
                            </Button>
                          ) : liveStatus === 'Cancelled' ? (
                            <Button size="md" disabled className="w-full lg:w-auto">
                              Cancelled
                            </Button>
                          ) : (
                            <Button size="md" href={`/pariksha/${exam.id}/register`} className="w-full lg:w-auto">
                              Register <ArrowRight className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ───── Top performers (admin-published) ───── */}
        {toppers.length > 0 && (
          <section className="container mx-auto px-4 sm:px-6 mt-20 sm:mt-28">
            <div className="grid lg:grid-cols-12 gap-6 sm:gap-10 items-end mb-10 sm:mb-14">
              <div className="lg:col-span-8">
                <span className="text-[11px] uppercase tracking-[0.22em] text-neutral-500 font-medium flex items-center gap-2 mb-4 sm:mb-6">
                  <span className="w-6 h-px bg-neutral-900" />
                  Hall of Fame
                </span>
                <h2 className="font-display text-4xl sm:text-5xl md:text-6xl leading-[1.02] tracking-[-0.03em] text-neutral-900">
                  Our top <span className="italic-serif">rankers.</span>
                </h2>
              </div>
              <div className="lg:col-span-4">
                <p className="text-neutral-600 text-base leading-relaxed">
                  The highest scorers across recent Pariksha mock exams. Your name could be next.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {toppers.map((t) => {
                const isFirst = t.rank === 1;
                return (
                  <div
                    key={t.id}
                    className={`relative flex items-center gap-4 rounded-2xl border p-4 sm:p-5 transition-all ${
                      isFirst
                        ? 'border-amber-300 bg-linear-to-br from-amber-50 to-white shadow-[0_16px_40px_-20px_rgba(245,158,11,0.4)]'
                        : 'border-neutral-200 bg-white hover:border-neutral-300'
                    }`}
                  >
                    <div className="relative shrink-0">
                      {t.photo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={t.photo_url} alt={t.student_name} className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-white shadow" />
                      ) : (
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-neutral-900 text-white flex items-center justify-center font-display text-xl">
                          {t.student_name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span
                        className={`absolute -top-1.5 -right-1.5 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black border-2 border-white ${
                          isFirst ? 'bg-amber-400 text-amber-950' : 'bg-neutral-900 text-white'
                        }`}
                      >
                        {t.rank}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        {isFirst && <Trophy className="w-4 h-4 text-amber-500 shrink-0" />}
                        <p className="font-bold text-neutral-900 truncate">{t.student_name}</p>
                      </div>
                      {t.subject && <p className="text-[13px] text-neutral-500 truncate">{t.subject}</p>}
                      {t.marks != null && (
                        <p className="text-[12px] font-mono text-neutral-700 mt-0.5">
                          {t.marks}{t.total_marks ? `/${t.total_marks}` : ''} marks
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
