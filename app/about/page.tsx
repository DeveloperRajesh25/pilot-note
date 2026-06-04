import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import {
  Plane,
  BookOpen,
  Award,
  Compass,
  Target,
  Users,
  Heart,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';
import { SITE_STATS } from '@/app/constants/data';

export const metadata: Metadata = {
  title: 'About — Pilot Note',
  description:
    'Pilot Note is India’s complete CPL study platform — DGCA RTR practice, comprehensive guides, all-India mock exams, and pilot aptitude tests. Built by pilots, for the ones who’ll fly next.',
};

const PILLARS = [
  {
    icon: <Plane className="w-5 h-5" strokeWidth={1.5} />,
    title: 'DGCA RTR Practice',
    desc: 'Exam-pattern MCQs across all five CPL ground subjects with detailed explanations — designed to mirror the real DGCA paper.',
  },
  {
    icon: <BookOpen className="w-5 h-5" strokeWidth={1.5} />,
    title: 'In-depth Guides',
    desc: 'Step-by-step articles on becoming a pilot, choosing a flying school, medicals, exam strategy, and life after the CPL.',
  },
  {
    icon: <Award className="w-5 h-5" strokeWidth={1.5} />,
    title: 'Pariksha — All India Mocks',
    desc: 'Nationwide real-time mock exams. Sit alongside thousands of student pilots, get a true rank, and measure your readiness.',
  },
  {
    icon: <Compass className="w-5 h-5" strokeWidth={1.5} />,
    title: 'COMPASS Aptitude',
    desc: 'Full COMPASS-style aptitude — spatial reasoning, numerical ability, verbal reasoning, and instrument comprehension.',
  },
];

const VALUES = [
  {
    icon: <Target className="w-5 h-5" strokeWidth={1.5} />,
    title: 'Accuracy over noise',
    desc: 'Every question, every guide, every explanation is reviewed against current DGCA syllabi and real exam patterns.',
  },
  {
    icon: <Heart className="w-5 h-5" strokeWidth={1.5} />,
    title: 'Built by pilots',
    desc: 'We’ve sat the exams ourselves. Pilot Note is the platform we wished existed when we were starting out.',
  },
  {
    icon: <Users className="w-5 h-5" strokeWidth={1.5} />,
    title: 'For every aspirant',
    desc: 'Whether you’re a 12th-grade student dreaming of the cockpit or weeks away from your CPL — there’s a path here for you.',
  },
  {
    icon: <Sparkles className="w-5 h-5" strokeWidth={1.5} />,
    title: 'Honest and ad-free',
    desc: 'No fluff, no clickbait, no third-party ads. Just clean, focused preparation that respects your time.',
  },
];


export default function AboutPage() {
  return (
    <>
      <Header />
      <main className="grow bg-white">
        {/* ───── HERO ───── */}
        <section className="relative pt-28 sm:pt-32 lg:pt-36 pb-16 sm:pb-24 overflow-hidden">
          <div className="absolute inset-0 bg-grid opacity-60 pointer-events-none" />
          <div className="hidden md:block absolute top-1/3 -left-32 w-[420px] h-[420px] bg-emerald-100/30 rounded-full blur-[120px] pointer-events-none" />
          <div className="hidden md:block absolute bottom-0 -right-32 w-[380px] h-[380px] bg-neutral-100 rounded-full blur-[100px] pointer-events-none" />

          <div className="container mx-auto px-4 sm:px-6 relative">
            <div className="max-w-3xl">
              <span className="text-[11px] uppercase tracking-[0.22em] text-neutral-500 font-medium flex items-center gap-2 mb-4 sm:mb-6">
                <span className="w-6 h-px bg-neutral-900" /> About Pilot Note
              </span>
              <h1 className="font-display text-[clamp(2rem,8vw,4.5rem)] leading-[1.05] tracking-[-0.03em] text-neutral-900 mb-5 sm:mb-6">
                Built for the next generation of <span className="italic-serif">Indian captains</span>.
              </h1>
              <p className="text-neutral-600 text-base sm:text-lg max-w-2xl leading-relaxed">
                Pilot Note is a focused study platform for aspiring commercial pilots in India. We bring
                together every tool you need to clear your DGCA ground papers, ace the COMPASS aptitude
                test, and confidently step into the cockpit — in one calm, distraction-free place.
              </p>
            </div>
          </div>
        </section>

        {/* ───── MISSION ───── */}
        <section className="py-14 sm:py-20 border-t border-neutral-200">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-start">
              <div className="lg:col-span-4">
                <span className="text-[11px] uppercase tracking-[0.22em] text-neutral-500 font-medium flex items-center gap-2 mb-4 sm:mb-5">
                  <span className="w-6 h-px bg-neutral-900" /> Our Mission
                </span>
                <h2 className="font-display text-3xl sm:text-4xl md:text-5xl text-neutral-900 leading-[1.05] tracking-tight">
                  Make pilot training in India <span className="italic-serif">accessible</span>, honest, and high quality.
                </h2>
              </div>
              <div className="lg:col-span-7 lg:col-start-6 space-y-4 sm:space-y-5 text-neutral-600 text-sm sm:text-[15px] leading-relaxed">
                <p>
                  Becoming a commercial pilot in India is hard — not because of the flying, but because
                  good information is fragmented. Coaching is expensive. Question banks are outdated. Forums
                  contradict themselves. We watched friends spend lakhs on material that didn’t match the
                  real DGCA paper.
                </p>
                <p>
                  Pilot Note exists to change that. We consolidate the best of what we — and the pilots
                  we’ve trained with — used to clear our exams: a thoroughly reviewed question bank,
                  ground-school grade explanations, and the all-India mock environment that prepares you
                  for the pressure of the real thing.
                </p>
                <p>
                  Our long-term goal is simple: when an Indian student decides to become a pilot, the
                  first stop they bookmark should be Pilot Note.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ───── WHAT WE DO ───── */}
        <section className="py-14 sm:py-20 bg-neutral-50 border-t border-neutral-200">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="max-w-2xl mb-10 sm:mb-14">
              <span className="text-[11px] uppercase tracking-[0.22em] text-neutral-500 font-medium flex items-center gap-2 mb-4 sm:mb-5">
                <span className="w-6 h-px bg-neutral-900" /> What we offer
              </span>
              <h2 className="font-display text-3xl sm:text-4xl md:text-5xl text-neutral-900 leading-[1.05] tracking-tight">
                Four pillars. One <span className="italic-serif">complete</span> platform.
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              {PILLARS.map((p) => (
                <div
                  key={p.title}
                  className="group bg-white border border-neutral-200 rounded-2xl sm:rounded-3xl p-5 sm:p-7 hover:border-neutral-900 hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="w-11 h-11 rounded-2xl bg-neutral-900 text-white flex items-center justify-center mb-4 sm:mb-5 group-hover:bg-emerald-500 transition-colors">
                    {p.icon}
                  </div>
                  <h3 className="font-display text-lg sm:text-xl text-neutral-900 mb-2.5">{p.title}</h3>
                  <p className="text-neutral-600 text-sm leading-relaxed">{p.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ───── STATS ───── */}
        <section className="py-14 sm:py-20 border-t border-neutral-200">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-neutral-200 border border-neutral-200 rounded-2xl sm:rounded-3xl overflow-hidden">
              {SITE_STATS.map((s) => (
                <div key={s.label} className="bg-white p-5 sm:p-8 lg:p-10 flex flex-col gap-2">
                  <p className="font-display text-3xl sm:text-4xl md:text-5xl text-neutral-900 tracking-tight">
                    {s.value}
                  </p>
                  <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.22em] text-neutral-500 font-medium">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ───── VALUES ───── */}
        <section className="py-14 sm:py-20 border-t border-neutral-200">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="max-w-2xl mb-10 sm:mb-14">
              <span className="text-[11px] uppercase tracking-[0.22em] text-neutral-500 font-medium flex items-center gap-2 mb-4 sm:mb-5">
                <span className="w-6 h-px bg-neutral-900" /> What we stand for
              </span>
              <h2 className="font-display text-3xl sm:text-4xl md:text-5xl text-neutral-900 leading-[1.05] tracking-tight">
                A few things we <span className="italic-serif">don’t</span> compromise on.
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-8 sm:gap-10">
              {VALUES.map((v) => (
                <div key={v.title} className="flex gap-4 sm:gap-5">
                  <div className="shrink-0 w-11 h-11 rounded-2xl border border-neutral-200 text-neutral-900 flex items-center justify-center">
                    {v.icon}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-display text-lg sm:text-xl text-neutral-900 mb-2">{v.title}</h3>
                    <p className="text-neutral-600 text-sm sm:text-[15px] leading-relaxed">{v.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ───── CTA ───── */}
        <section className="py-16 sm:py-24 border-t border-neutral-200 bg-neutral-50">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="font-display text-3xl sm:text-4xl md:text-5xl text-neutral-900 leading-[1.05] tracking-tight mb-4 sm:mb-5">
                Ready to start your <span className="italic-serif">pilot journey?</span>
              </h2>
              <p className="text-neutral-600 text-base sm:text-lg max-w-xl mx-auto mb-7 sm:mb-8">
                Create a free account and start practicing today — no card, no commitment.
              </p>
              <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-center gap-3">
                <Button href="/signup" variant="primary" size="lg" className="justify-center">
                  Get started
                </Button>
                <Link
                  href="/contact"
                  className="group inline-flex items-center justify-center gap-1.5 text-sm font-medium text-neutral-700 hover:text-neutral-900 px-4 py-3"
                >
                  Talk to us
                  <ArrowUpRight
                    size={14}
                    className="text-emerald-500 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
