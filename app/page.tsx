import React from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { SketchCanvas } from '@/components/ui/SketchCanvas';
import { HERO_CONTENT, FEATURES, WHY_US } from '@/app/constants/data';
import Link from 'next/link';
import { ArrowUpRight, Plane, Compass, BookOpen, Award } from 'lucide-react';

const FEATURE_ICONS: Record<string, React.ReactNode> = {
  f1: <Plane className="w-5 h-5" strokeWidth={1.5} />,
  f2: <BookOpen className="w-5 h-5" strokeWidth={1.5} />,
  f3: <Award className="w-5 h-5" strokeWidth={1.5} />,
  f4: <Compass className="w-5 h-5" strokeWidth={1.5} />,
};

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex-grow">
        {/* ──────────── HERO ──────────── */}
        <section className="relative h-[100dvh] min-h-[640px] max-h-[1000px] flex items-center overflow-hidden bg-white pt-20">
          {/* Background accents */}
          <div className="absolute inset-0 bg-grid opacity-60 pointer-events-none" />
          <div className="absolute top-1/4 -left-32 w-[420px] h-[420px] bg-emerald-100/30 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-0 -right-32 w-[380px] h-[380px] bg-neutral-100 rounded-full blur-[100px] pointer-events-none" />

          <div className="container mx-auto px-6 relative w-full">
            <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">
              {/* Left — copy */}
              <div className="lg:col-span-7 relative">
                <span className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-white border border-neutral-200 text-neutral-600 text-[10px] font-medium tracking-[0.18em] uppercase mb-6 shadow-sm">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                  </span>
                  {HERO_CONTENT.badge}
                </span>

                <h1 className="font-display text-[clamp(2.5rem,5.5vw,5rem)] leading-[1] tracking-[-0.03em] text-neutral-900 mb-6">
                  One stop for the <span className="italic-serif">future</span>
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 align-middle mx-2" />
                  captains <span className="text-neutral-400">of India.</span>
                </h1>

                <p className="text-neutral-600 text-base md:text-lg max-w-xl leading-relaxed mb-8 font-normal">
                  {HERO_CONTENT.subtitle}
                </p>

                <div className="flex flex-wrap items-center gap-3">
                  <Button variant="primary" size="lg" href="/dgca-rtr">
                    Start learning
                    <ArrowUpRight size={16} />
                  </Button>
                  <Button variant="secondary" size="lg" href="/pariksha">
                    Take an exam
                  </Button>
                </div>
              </div>

              {/* Right — visual */}
              <div className="lg:col-span-5 relative">
                <div className="relative">
                  <div className="relative bg-neutral-50 border border-neutral-200/70 rounded-[1.75rem] p-3 shadow-[0_30px_80px_-20px_rgba(10,10,10,0.18)] transform lg:rotate-1 hover:rotate-0 transition-transform duration-700">
                    <div className="aspect-[5/4] relative bg-white rounded-[1.25rem] overflow-hidden border border-neutral-200/60">
                      <SketchCanvas />
                    </div>
                  </div>

                  {/* Floating callouts */}
                  <div className="hidden sm:flex absolute -left-4 -bottom-4 bg-white border border-neutral-200 rounded-2xl px-3.5 py-2.5 shadow-lg animate-float">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center">
                        <Plane size={14} />
                      </div>
                      <div>
                        <p className="text-[9px] uppercase tracking-[0.18em] text-neutral-500">Success</p>
                        <p className="text-xs font-medium text-neutral-900">95% clear CPL</p>
                      </div>
                    </div>
                  </div>

                  <div
                    className="hidden sm:flex absolute -right-3 -top-3 bg-neutral-900 text-white rounded-2xl px-3.5 py-2.5 shadow-xl animate-float"
                    style={{ animationDelay: '1.5s' }}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-white text-neutral-900 flex items-center justify-center">
                        <Award size={14} />
                      </div>
                      <div>
                        <p className="text-[9px] uppercase tracking-[0.18em] text-white/60">Live</p>
                        <p className="text-xs font-medium">Pariksha Apr 15</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ──────────── MARQUEE STRIP ──────────── */}
        <section className="border-y border-neutral-200 bg-neutral-50 overflow-hidden">
          <div
            className="flex w-max py-5"
            style={{ animation: 'pn-marquee 38s linear infinite' }}
          >
            {[...Array(2)].map((_, dup) => (
              <div key={dup} className="flex items-center gap-12 px-6 shrink-0">
                {[
                  'DGCA RTR(A)',
                  'Air Navigation',
                  'Meteorology',
                  'Aviation Met',
                  'Air Regulations',
                  'Technical General',
                  'COMPASS Aptitude',
                  'Class 1 Medical',
                  'Pariksha National Mocks',
                  'Phraseology',
                ].map((label, i) => (
                  <span
                    key={i}
                    className="flex items-center gap-12 text-2xl md:text-3xl font-display text-neutral-900 whitespace-nowrap"
                  >
                    {label}
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  </span>
                ))}
              </div>
            ))}
          </div>
        </section>

        {/* ──────────── FEATURES ──────────── */}
        <section className="py-32 bg-white relative" id="features">
          <div className="container mx-auto px-6">
            <div className="grid lg:grid-cols-12 gap-12 mb-20">
              <div className="lg:col-span-5">
                <span className="text-[11px] uppercase tracking-[0.22em] text-neutral-500 font-medium flex items-center gap-2 mb-6">
                  <span className="w-6 h-px bg-neutral-900" />
                  What we offer
                </span>
                <h2 className="font-display text-5xl md:text-6xl lg:text-7xl leading-[1] tracking-[-0.03em] text-neutral-900">
                  Everything to <br />
                  <span className="italic-serif">clear</span> CPL.
                </h2>
              </div>
              <div className="lg:col-span-6 lg:col-start-7 flex items-end">
                <p className="text-neutral-600 text-lg leading-relaxed max-w-xl">
                  Four instruments designed for aspiring commercial pilots. Practice, learn, compete,
                  and assess your readiness — all in one cockpit.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
              {FEATURES.map((feature, idx) => (
                <Link
                  key={feature.id}
                  href={feature.linkUrl}
                  className="group relative bg-white border border-neutral-200 rounded-3xl p-8 lg:p-10 transition-all duration-300 hover:border-neutral-900 hover:shadow-[0_24px_48px_-24px_rgba(10,10,10,0.18)] flex flex-col"
                >
                  {/* Index */}
                  <div className="flex items-center justify-between mb-12">
                    <span className="text-[11px] tracking-[0.22em] uppercase text-neutral-400 font-mono">
                      {String(idx + 1).padStart(2, '0')} / 04
                    </span>
                    <ArrowUpRight
                      size={18}
                      className="text-neutral-300 group-hover:text-emerald-500 group-hover:-translate-y-1 group-hover:translate-x-1 transition-all"
                    />
                  </div>

                  {/* Icon */}
                  <div className="w-12 h-12 rounded-xl bg-neutral-100 group-hover:bg-emerald-500 group-hover:text-white text-neutral-900 flex items-center justify-center mb-8 transition-colors">
                    {FEATURE_ICONS[feature.id]}
                  </div>

                  <h3 className="font-display text-3xl text-neutral-900 mb-3 leading-tight">
                    {feature.title}
                  </h3>
                  <p className="text-neutral-600 text-sm leading-relaxed flex-grow mb-8">
                    {feature.desc}
                  </p>

                  <div className="text-[12px] uppercase tracking-[0.18em] text-neutral-900 font-medium">
                    <span className="link-underline">{feature.linkText.replace(' →', '')}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ──────────── WHY US ──────────── */}
        <section className="py-32 bg-white" id="why">
          <div className="container mx-auto px-6">
            <div className="grid lg:grid-cols-12 gap-10 mb-20">
              <div className="lg:col-span-7">
                <span className="text-[11px] uppercase tracking-[0.22em] text-neutral-500 font-medium flex items-center gap-2 mb-6">
                  <span className="w-6 h-px bg-neutral-900" />
                  Why Pilot Note
                </span>
                <h2 className="font-display text-5xl md:text-7xl leading-[0.95] tracking-[-0.03em] text-neutral-900">
                  Made by pilots.
                  <br />
                  <span className="italic-serif text-neutral-400">For the next ones.</span>
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-px">
              {WHY_US.map((item, idx) => (
                <div
                  key={item.id}
                  className="group relative py-12 border-b border-neutral-200 last:border-b-0 md:[&:nth-last-child(2)]:border-b-0"
                >
                  <div className="flex items-start gap-8">
                    <div className="shrink-0">
                      <p className="text-[11px] tracking-[0.22em] uppercase text-neutral-400 font-mono mb-2">
                        Item {item.number}
                      </p>
                      <p className="font-display text-5xl text-neutral-300 group-hover:text-emerald-500 transition-colors leading-none">
                        {String(idx + 1).padStart(2, '0')}
                      </p>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-display text-2xl md:text-3xl text-neutral-900 mb-4 leading-tight">
                        {item.title}
                      </h3>
                      <p className="text-neutral-600 leading-relaxed text-[15px]">{item.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ──────────── CTA ──────────── */}
        <section className="relative py-40 bg-neutral-950 text-white overflow-hidden">
          <div className="absolute inset-0 bg-grid opacity-[0.04] pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.18)_0%,transparent_60%)] pointer-events-none" />

          <div className="container mx-auto px-6 relative text-center">
            <span className="text-[11px] uppercase tracking-[0.22em] text-emerald-400 font-medium flex items-center justify-center gap-2 mb-8">
              <span className="w-6 h-px bg-emerald-400" />
              Join Pilot Note
              <span className="w-6 h-px bg-emerald-400" />
            </span>

            <h2 className="font-display text-white text-6xl md:text-8xl lg:text-9xl leading-[0.9] tracking-[-0.03em] mb-10 max-w-5xl mx-auto">
              Your <span className="italic-serif">cockpit</span> awaits.
            </h2>

            <p className="text-neutral-400 text-lg md:text-xl mb-14 max-w-2xl mx-auto leading-relaxed">
              Trusted by 12,500+ student pilots across India. Your complete CPL preparation
              companion — from first MCQ to that final &ldquo;line-up and wait.&rdquo;
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <Button size="lg" variant="violet" href="/signup" className="px-10 h-14">
                Start free <ArrowUpRight size={18} />
              </Button>
              <Button size="lg" variant="outline" href="/guides" className="text-white border-white/30 hover:bg-white hover:text-neutral-900 hover:border-white px-10 h-14">
                Read guides
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
