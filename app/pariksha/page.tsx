"use client";

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { Users, Calendar, Clock, FileText, ArrowRight } from 'lucide-react';

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
  status: string;
  registrations: number;
  isRegistered: boolean;
  hasAttempted: boolean;
}

const STATUS_BADGE: Record<string, string> = {
  Upcoming: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
  Active: 'bg-amber-50 text-amber-700 border-amber-200/60',
  Completed: 'bg-neutral-100 text-neutral-500 border-neutral-200/60',
};

export default function ParikshaPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
    });

  return (
    <>
      <Header />
      <main className="grow pt-36 pb-32 bg-white">
        {/* ───── Hero ───── */}
        <section className="container mx-auto px-6 mb-20">
          <div className="grid lg:grid-cols-12 gap-10 items-end">
            <div className="lg:col-span-8">
              <span className="text-[11px] uppercase tracking-[0.22em] text-neutral-500 font-medium flex items-center gap-2 mb-6">
                <span className="w-6 h-px bg-neutral-900" />
                Pariksha · All India Mock Exams
              </span>
              <h1 className="font-display text-5xl md:text-7xl lg:text-8xl leading-[0.95] tracking-[-0.03em] text-neutral-900">
                Real exam.
                <br />
                <span className="italic-serif">Real</span> competition.
              </h1>
            </div>
            <div className="lg:col-span-4">
              <p className="text-neutral-600 text-lg leading-relaxed mb-6">
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
        <section className="container mx-auto px-6">
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
                const statusClass = STATUS_BADGE[exam.status] || STATUS_BADGE.Upcoming;
                return (
                  <div
                    key={exam.id}
                    className="bg-white border border-neutral-200 rounded-3xl p-8 lg:p-10 group hover:border-neutral-900 hover:shadow-[0_24px_48px_-24px_rgba(10,10,10,0.18)] transition-all duration-300"
                  >
                    <div className="grid lg:grid-cols-12 gap-8 items-start">
                      {/* Left — meta */}
                      <div className="lg:col-span-1">
                        <span className="text-[11px] tracking-[0.22em] uppercase text-neutral-400 font-mono">
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                      </div>

                      {/* Middle — content */}
                      <div className="lg:col-span-7">
                        <div className="flex flex-wrap items-center gap-2.5 mb-4">
                          <span className={`px-3 py-1 text-[10px] font-medium uppercase tracking-[0.18em] rounded-full border ${statusClass}`}>
                            {exam.status}
                          </span>
                          <span className="text-[11px] uppercase tracking-[0.18em] text-neutral-500 font-medium">
                            {exam.subject}
                          </span>
                        </div>
                        <h3 className="font-display text-3xl md:text-4xl text-neutral-900 mb-4 leading-tight">
                          {exam.title}
                        </h3>
                        <p className="text-neutral-600 text-[15px] leading-relaxed mb-6 max-w-2xl">
                          {exam.description}
                        </p>

                        {/* Meta strip */}
                        <div className="flex flex-wrap items-center gap-x-8 gap-y-3 text-sm">
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
                      <div className="lg:col-span-4 lg:text-right">
                        <div className="mb-5">
                          <p className="font-display text-4xl text-neutral-900 leading-none tracking-tight">
                            ₹{exam.fee}
                          </p>
                          <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-400 mt-2">
                            Per attempt
                          </p>
                        </div>

                        {exam.hasAttempted ? (
                          <Link href={`/pariksha/${exam.id}/results`}>
                            <Button variant="secondary" size="md">
                              View results <ArrowRight className="w-4 h-4" />
                            </Button>
                          </Link>
                        ) : exam.isRegistered ? (
                          <Link href={`/pariksha/${exam.id}`}>
                            <Button variant="violet" size="md">
                              Enter exam <ArrowRight className="w-4 h-4" />
                            </Button>
                          </Link>
                        ) : exam.status === 'Completed' ? (
                          <Button size="md" disabled>
                            Exam ended
                          </Button>
                        ) : (
                          <Link href={`/pariksha/${exam.id}/register`}>
                            <Button size="md">
                              Register <ArrowRight className="w-4 h-4" />
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
