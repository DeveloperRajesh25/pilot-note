import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white flex">
      {/* Left — form column */}
      <div className="flex-1 flex flex-col justify-between gap-8 sm:gap-10 px-5 py-8 sm:p-10 lg:p-14 relative">
        {/* Brand */}
        <Link href="/" className="inline-flex items-center gap-2 group w-fit">
          <Image
            src="/logo.png"
            alt="Pilot Note"
            width={140}
            height={32}
            className="h-7 sm:h-8 w-auto transition-transform group-hover:-translate-y-0.5"
            priority
          />
        </Link>

        <main className="w-full max-w-md mx-auto lg:mx-0 animate-fade-up">{children}</main>

        <footer className="text-xs text-neutral-400 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <p>
            © {new Date().getFullYear()}{' '}
            <span className="text-neutral-700 font-medium">Pilot Note</span>
          </p>
          <div className="flex gap-5">
            <Link href="/privacy" className="hover:text-neutral-900 transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-neutral-900 transition-colors">
              Terms
            </Link>
          </div>
        </footer>
      </div>

      {/* Right — editorial visual column */}
      <div className="hidden lg:flex flex-1 relative bg-neutral-950 text-white overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-[0.04]" />
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] bg-emerald-500/15 rounded-full blur-[120px]" />
        <div className="absolute -bottom-40 -left-32 w-[600px] h-[600px] bg-emerald-400/10 rounded-full blur-[140px]" />

        {/* Content */}
        <div className="relative flex flex-col justify-between p-14 w-full">
          <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.22em] text-white/60 font-medium">
            <span className="flex items-center gap-2">
              <span className="w-6 h-px bg-white/40" />
              For aspiring captains
            </span>
            <span className="font-mono text-white/40">CPL · 2026</span>
          </div>

          <div>
            <p className="font-display text-[clamp(3.2rem,6vw,5.5rem)] leading-[0.95] tracking-[-0.03em] text-white mb-8">
              The home for
              <br />
              <span className="italic-serif text-emerald-400">future pilots</span>
              <br />
              of India.
            </p>
            <p className="text-white/60 text-lg max-w-md leading-relaxed">
              DGCA RTR practice, study guides, all-India mock exams, and pilot aptitude assessments —
              every step from your first MCQ to your final checkride.
            </p>
          </div>

          {/* Bottom stats */}
          <div className="grid grid-cols-3 gap-6 pt-10 border-t border-white/10">
            {[
              ['12,500+', 'Student pilots'],
              ['95%', 'Success rate'],
              ['500+', 'Practice Qs'],
            ].map(([num, label]) => (
              <div key={label}>
                <p className="font-display text-3xl text-white tracking-tight">{num}</p>
                <p className="text-[10px] uppercase tracking-[0.18em] text-white/50 mt-1.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
