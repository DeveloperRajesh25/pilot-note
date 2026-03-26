"use client";

import React, { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { RTR_TESTS, RTR_CONFIG } from '@/app/constants/data';

export default function DGCARTRPage() {
  const [purchasedTests, setPurchasedTests] = useState<string[]>([]);

  const handlePurchase = (testId: string) => {
    if (confirm('This is a simulated purchase. In the live version, this will redirect to a payment gateway. Proceed with free access for testing?')) {
      setPurchasedTests([...purchasedTests, testId]);
    }
  };

  return (
    <>
      <Header />
      <main className="flex-grow pt-32 pb-24 bg-neutral-50">
        {/* Page Header */}
        <div className="container mx-auto px-6 mb-16">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-6xl font-black mb-6">DGCA RTR</h1>
            <p className="text-gray-500 text-lg">Full RTR(A) exam simulation — realistic mock tests with Part 1 (MCQ) and Part 2 (RT Transmission).</p>
          </div>
        </div>

        {/* Content Section */}
        <section className="container mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-accent font-bold tracking-widest uppercase text-sm mb-4 block">RTR(A) Exam Simulation</span>
            <h2 className="text-3xl md:text-4xl font-black mb-6">Purchase RTR Mock Tests</h2>
            <p className="text-gray-500">Full DGCA RTR(A) exam simulation — Part 1 (50 MCQ, 2 hours) + Part 2 (RT Transmission, 25 min). Exactly like the real exam.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {RTR_TESTS.map((test) => {
              const isPurchased = purchasedTests.includes(test.id);
              return (
                <div key={test.id} className="bg-white p-8 rounded-[2rem] border border-neutral-100 shadow-xl flex flex-col justify-between">
                  <div>
                    <h3 className="text-2xl font-black mb-4">{test.title}</h3>
                    <p className="text-gray-500 mb-8 text-sm line-clamp-2">{test.description}</p>
                    
                    <div className="space-y-6 mb-8">
                      {/* Part 1 Info */}
                      <div className="p-5 rounded-2xl bg-neutral-50 border border-neutral-100 relative overflow-hidden">
                        <div className="absolute top-4 right-4 flex items-center gap-1 text-[10px] font-bold text-green-500 uppercase tracking-tighter">
                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,1)]" />
                          50 Qs
                        </div>
                        <h4 className="flex items-center gap-2 font-bold mb-4 text-gray-900">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-gray-400"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                          Part 1 — MCQ
                        </h4>
                        <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span className="font-bold text-gray-900">{RTR_CONFIG.part1.duration}</span> min
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span className="font-bold text-gray-900">{RTR_CONFIG.part1.totalMarks}</span> marks
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span className="font-bold text-gray-900">{RTR_CONFIG.part1.totalQuestions}</span> questions
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span className="font-bold text-gray-900">{RTR_CONFIG.part1.passingMarks}</span> to pass
                          </div>
                        </div>
                      </div>

                      {/* Part 2 Info */}
                      <div className="p-5 rounded-2xl bg-violet/5 border border-violet/10 relative overflow-hidden">
                        <div className="absolute top-4 right-4 flex items-center gap-1 text-[10px] font-bold text-violet uppercase tracking-tighter">
                          <span className="w-1.5 h-1.5 bg-violet rounded-full shadow-[0_0_8px_rgba(124,58,237,1)]" />
                          5 Scen
                        </div>
                        <h4 className="flex items-center gap-2 font-bold mb-4 text-violet">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
                          Part 2 — Radio
                        </h4>
                        <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span className="font-bold text-gray-900">{RTR_CONFIG.part2.duration}</span> min
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span className="font-bold text-gray-900">{RTR_CONFIG.part2.totalMarks}</span> marks
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500 col-span-2">
                             <span className="font-bold text-gray-900">{RTR_CONFIG.part2.totalQuestions}</span> interactive scenarios
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="pt-6 border-t border-gray-100 flex items-baseline gap-2 mb-6">
                      <span className="text-3xl font-black text-gray-900">₹{test.price}</span>
                      <span className="text-sm text-gray-400 font-medium">per test</span>
                    </div>

                    <div className="flex gap-3">
                      {isPurchased ? (
                        <>
                          <Button className="flex-1" href={`/rtr-exam?testId=${test.id}&part=part1`}>Part 1</Button>
                          <Button variant="violet" className="flex-1" href={`/rtr-exam?testId=${test.id}&part=part2`}>Part 2</Button>
                        </>
                      ) : (
                        <Button className="w-full" onClick={() => handlePurchase(test.id)}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="mr-1"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                          Purchase Test
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
