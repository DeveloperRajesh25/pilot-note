"use client";

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

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

const SUBJECT_COLORS: Record<string, string> = {
  'Air Navigation': 'from-blue-400 to-blue-600',
  'Meteorology': 'from-violet-400 to-violet-600',
  'Air Regulations': 'from-emerald-400 to-emerald-600',
  'Technical General': 'from-orange-400 to-orange-600',
};

const STATUS_BADGE: Record<string, string> = {
  'Upcoming': 'bg-amber-50 text-amber-700 border-amber-200',
  'Active': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Completed': 'bg-neutral-100 text-neutral-500 border-neutral-200',
};

export default function ParikshaPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState<string | null>(null);
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

  const handleRegister = async (examId: string) => {
    setRegistering(examId);
    try {
      const res = await fetch(`/api/exams/${examId}/register`, { method: 'POST' });
      if (res.status === 401) { window.location.href = '/login'; return; }
      const data = await res.json();
      if (!res.ok && !data.alreadyRegistered) {
        alert(data.error || 'Registration failed.');
        return;
      }
      await fetchExams();
    } catch {
      alert('Network error. Please try again.');
    } finally {
      setRegistering(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
  };

  return (
    <>
      <Header />
      <main className="flex-grow pt-48 pb-32 bg-neutral-50 overflow-hidden">
        {/* Page Header */}
        <div className="container mx-auto px-6 mb-20">
          <div className="max-w-4xl">
            <span className="inline-block px-4 py-1.5 bg-violet/10 text-violet text-xs font-bold rounded-full uppercase tracking-widest mb-6 border border-violet/20">
              National Level Mock Exams
            </span>
            <h1 className="text-5xl md:text-8xl font-black mb-8 tracking-tighter text-neutral-900 leading-[0.95]">
              Pariksha <span className="text-violet">Mock Exams</span>
            </h1>
            <p className="text-neutral-500 text-xl leading-relaxed font-medium max-w-2xl">
              All India mock examinations for CPL subjects. Real exam experience. Real competition. Real results.
            </p>
          </div>
        </div>

        {/* Exams Section */}
        <section className="container mx-auto px-6">
          {loading ? (
            <div className="grid gap-8 max-w-5xl mx-auto">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-white rounded-[2.5rem] border border-neutral-100 p-8 animate-pulse">
                  <div className="flex gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-neutral-100 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="h-7 bg-neutral-100 rounded w-2/3 mb-3" />
                      <div className="h-4 bg-neutral-100 rounded w-full mb-2" />
                      <div className="h-4 bg-neutral-100 rounded w-4/5" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <p className="text-rose-500 font-bold">{error}</p>
            </div>
          ) : (
            <div className="grid gap-8 max-w-5xl mx-auto">
              {exams.map((exam) => {
                const gradient = SUBJECT_COLORS[exam.subject] || 'from-neutral-400 to-neutral-600';
                const statusClass = STATUS_BADGE[exam.status] || STATUS_BADGE.Upcoming;

                return (
                  <div key={exam.id} className="bg-white rounded-[2.5rem] border border-neutral-100 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 overflow-hidden">
                    <div className="p-8 md:p-10">
                      <div className="flex flex-col md:flex-row gap-6">
                        {/* Subject Icon */}
                        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-2xl font-black flex-shrink-0 shadow-lg`}>
                          {exam.subject.charAt(0)}
                        </div>

                        {/* Main Content */}
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-3 mb-3">
                            <span className={`px-3 py-1 text-[11px] font-black uppercase tracking-widest rounded-full border ${statusClass}`}>
                              {exam.status}
                            </span>
                            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">{exam.subject}</span>
                          </div>
                          <h3 className="text-2xl font-black text-neutral-900 mb-3">{exam.title}</h3>
                          <p className="text-neutral-500 text-sm leading-relaxed mb-6">{exam.description}</p>

                          {/* Exam Meta Grid */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            <div className="bg-neutral-50 rounded-xl p-3">
                              <p className="text-xs text-neutral-400 font-medium mb-1">Date</p>
                              <p className="text-sm font-bold text-neutral-900">{formatDate(exam.exam_date)}</p>
                            </div>
                            <div className="bg-neutral-50 rounded-xl p-3">
                              <p className="text-xs text-neutral-400 font-medium mb-1">Time (IST)</p>
                              <p className="text-sm font-bold text-neutral-900">{exam.exam_time}</p>
                            </div>
                            <div className="bg-neutral-50 rounded-xl p-3">
                              <p className="text-xs text-neutral-400 font-medium mb-1">Duration</p>
                              <p className="text-sm font-bold text-neutral-900">{exam.duration} min</p>
                            </div>
                            <div className="bg-neutral-50 rounded-xl p-3">
                              <p className="text-xs text-neutral-400 font-medium mb-1">Questions</p>
                              <p className="text-sm font-bold text-neutral-900">{exam.total_questions}</p>
                            </div>
                          </div>

                          {/* Footer */}
                          <div className="flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1.5 text-sm text-neutral-500">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                                <span className="font-bold">{exam.registrations}</span> registered
                              </div>
                              <div className="text-xl font-black text-neutral-900">₹{exam.fee}</div>
                            </div>

                            <div className="flex items-center gap-3">
                              {exam.hasAttempted ? (
                                <Link href={`/pariksha/${exam.id}`}>
                                  <Button variant="secondary" size="lg">View Results</Button>
                                </Link>
                              ) : exam.isRegistered ? (
                                <Link href={`/pariksha/${exam.id}`}>
                                  <Button variant="violet" size="lg">Enter Exam →</Button>
                                </Link>
                              ) : (
                                <Button
                                  size="lg"
                                  onClick={() => handleRegister(exam.id)}
                                  disabled={registering === exam.id || exam.status === 'Completed'}
                                >
                                  {registering === exam.id ? (
                                    <span className="flex items-center gap-2">
                                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                                      Registering...
                                    </span>
                                  ) : exam.status === 'Completed' ? 'Exam Ended' : 'Register Now'}
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
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
