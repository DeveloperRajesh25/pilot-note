"use client";

import React from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function ParikshaPage() {
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

        {/* Coming Soon Section */}
        <section className="container mx-auto px-6 flex items-center justify-center min-h-[40vh]">
          <div className="text-center max-w-xl p-16 md:p-24 bg-white rounded-[3.5rem] border-2 border-neutral-100 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.1)] relative overflow-hidden group">
            {/* Top Animated Border */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-violet via-accent to-violet bg-[length:200%_100%] animate-[gradient-slide_3s_ease-in-out_infinite]" />
            
            <div className="text-8xl mb-12 transform group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-700">🚀</div>
            
            <h2 className="text-5xl md:text-7xl font-black mb-8 bg-gradient-to-br from-violet to-accent bg-clip-text text-transparent leading-none tracking-tight">
              Coming Soon!
            </h2>
            
            <p className="text-neutral-500 text-xl leading-relaxed mb-10 font-medium">
              Our All India mock examination platform is currently being flight-tested. Get ready to compete with student pilots nationwide.
            </p>
            
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-50 rounded-full border border-neutral-100 text-neutral-400 font-bold text-sm italic">
              <span className="w-2 h-2 bg-accent rounded-full animate-pulse" />
              Preparing for takeoff...
            </div>
          </div>
        </section>

        <style jsx>{`
          @keyframes gradient-slide {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
        `}</style>
      </main>
      <Footer />
    </>
  );
}

