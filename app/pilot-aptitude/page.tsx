import React from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Compass, ArrowRight } from 'lucide-react';

export const metadata = {
  title: 'Pilot Aptitude — Coming Soon | Pilot Note',
  description: 'The COMPASS-style pilot aptitude assessment is coming soon to Pilot Note.',
};

export default function PilotAptitudePage() {
  return (
    <>
      <Header />
      <main className="grow pt-28 sm:pt-32 lg:pt-36 pb-16 sm:pb-24 lg:pb-32 bg-white min-h-screen flex items-center">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-neutral-100 text-neutral-900 flex items-center justify-center mx-auto mb-8">
              <Compass className="w-8 h-8 sm:w-10 sm:h-10" strokeWidth={1.5} />
            </div>

            <span className="text-[11px] uppercase tracking-[0.22em] text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-3 py-1 rounded-full font-medium inline-flex items-center gap-2 mb-7">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 pulse-dot" />
              Coming Soon
            </span>

            <h1 className="font-display text-4xl sm:text-6xl md:text-7xl lg:text-8xl leading-[1] tracking-[-0.03em] text-neutral-900 mb-6">
              Pilot <span className="italic-serif">Aptitude.</span>
            </h1>

            <p className="text-neutral-600 text-base sm:text-lg leading-relaxed max-w-xl mx-auto mb-10">
              Our full COMPASS-style aptitude assessment — spatial reasoning, numerical ability,
              verbal reasoning, and instrument comprehension — is on its way. We&apos;re polishing it
              to mirror real airline selection. Check back shortly.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
              <Button variant="primary" size="lg" href="/dgca" className="justify-center">
                Practice DGCA subjects <ArrowRight className="w-4 h-4" />
              </Button>
              <Button variant="secondary" size="lg" href="/pariksha" className="justify-center">
                Explore Pariksha exams
              </Button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
