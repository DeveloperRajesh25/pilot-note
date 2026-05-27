import React from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

interface LegalLayoutProps {
  eyebrow: string;
  title: React.ReactNode;
  lastUpdated: string;
  intro?: React.ReactNode;
  toc?: { id: string; label: string }[];
  children: React.ReactNode;
}

export const LegalLayout = ({
  eyebrow,
  title,
  lastUpdated,
  intro,
  toc,
  children,
}: LegalLayoutProps) => {
  return (
    <>
      <Header />
      <main className="grow bg-white">
        {/* Hero */}
        <section className="relative pt-28 sm:pt-32 lg:pt-36 pb-10 sm:pb-16 overflow-hidden border-b border-neutral-200">
          <div className="absolute inset-0 bg-grid opacity-60 pointer-events-none" />
          <div className="hidden md:block absolute top-1/3 -left-32 w-[420px] h-[420px] bg-emerald-100/30 rounded-full blur-[120px] pointer-events-none" />

          <div className="container mx-auto px-4 sm:px-6 relative">
            <div className="max-w-3xl">
              <span className="text-[11px] uppercase tracking-[0.22em] text-neutral-500 font-medium flex items-center gap-2 mb-4 sm:mb-6">
                <span className="w-6 h-px bg-neutral-900" /> {eyebrow}
              </span>
              <h1 className="font-display text-[clamp(2rem,8vw,3.75rem)] leading-[1.05] tracking-[-0.03em] text-neutral-900 mb-4 sm:mb-5">
                {title}
              </h1>
              <p className="text-neutral-500 text-sm">
                <span className="font-medium text-neutral-700">Last updated:</span> {lastUpdated}
              </p>
              {intro && (
                <div className="mt-5 sm:mt-6 text-neutral-600 text-sm sm:text-[15px] leading-relaxed max-w-2xl">
                  {intro}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Body */}
        <section className="py-12 sm:py-16">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="grid lg:grid-cols-12 gap-8 lg:gap-12">
              {/* TOC */}
              {toc && toc.length > 0 && (
                <aside className="lg:col-span-3 hidden lg:block">
                  <div className="sticky top-28">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-neutral-500 font-medium mb-4">
                      On this page
                    </p>
                    <nav className="flex flex-col gap-2.5 text-sm">
                      {toc.map((item) => (
                        <a
                          key={item.id}
                          href={`#${item.id}`}
                          className="text-neutral-500 hover:text-neutral-900 transition-colors"
                        >
                          {item.label}
                        </a>
                      ))}
                    </nav>
                  </div>
                </aside>
              )}

              {/* Content */}
              <article
                className={`legal-prose ${
                  toc && toc.length > 0 ? 'lg:col-span-9' : 'lg:col-span-12 max-w-3xl mx-auto'
                }`}
              >
                {children}

                <div className="mt-10 sm:mt-16 pt-6 sm:pt-8 border-t border-neutral-200 flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center justify-between gap-3 sm:gap-4 text-sm">
                  <p className="text-neutral-500">
                    Questions about this page?{' '}
                    <Link href="/contact" className="text-neutral-900 underline underline-offset-4 hover:text-emerald-600">
                      Contact us
                    </Link>
                    .
                  </p>
                  <div className="flex flex-wrap items-center gap-4 sm:gap-5 text-neutral-500">
                    <Link href="/privacy" className="hover:text-neutral-900">Privacy</Link>
                    <Link href="/terms" className="hover:text-neutral-900">Terms</Link>
                    <Link href="/refund-policy" className="hover:text-neutral-900">Refunds</Link>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
};

interface LegalSectionProps {
  id: string;
  title: string;
  children: React.ReactNode;
}

export const LegalSection = ({ id, title, children }: LegalSectionProps) => {
  return (
    <section id={id} className="scroll-mt-28 mb-10 sm:mb-12">
      <h2 className="font-display text-xl sm:text-2xl md:text-3xl text-neutral-900 mb-4 sm:mb-5 tracking-tight">
        {title}
      </h2>
      <div className="space-y-3 sm:space-y-4 text-neutral-600 text-sm sm:text-[15px] leading-relaxed">
        {children}
      </div>
    </section>
  );
};
