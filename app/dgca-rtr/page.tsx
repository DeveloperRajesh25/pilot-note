"use client";

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { ModeSelectionModal } from '@/components/rtr/ModeSelectionModal';
import { RTR_CONFIG } from '@/app/constants/data';
import { CheckCircle2, Radio, FileText, Lock, Loader2, ArrowRight } from 'lucide-react';

interface RTRTest {
  id: string;
  title: string;
  description: string;
  price: number;
  status: string;
  isPurchased: boolean;
}

export default function DGCARTRPage() {
  const [tests, setTests] = useState<RTRTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modeModalOpen, setModeModalOpen] = useState(false);
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);
  const [selectedPart, setSelectedPart] = useState<'part1' | 'part2' | null>(null);

  const fetchTests = async () => {
    try {
      const res = await fetch('/api/rtr/tests');
      const data = await res.json();
      setTests(data.tests ?? []);
    } catch {
      setError('Failed to load tests. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTests(); }, []);

  const handlePurchase = async (testId: string) => {
    if (!confirm('This will unlock the RTR mock test for ₹299 (simulated payment). Proceed?')) return;
    setPurchasing(testId);
    try {
      const res = await fetch('/api/purchases/rtr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test_id: testId }),
      });
      const data = await res.json();
      if (res.status === 401) {
        window.location.href = '/login';
        return;
      }
      if (!res.ok && !data.alreadyOwned) {
        alert(data.error || 'Purchase failed. Please try again.');
        return;
      }
      await fetchTests();
    } catch {
      alert('Network error. Please try again.');
    } finally {
      setPurchasing(null);
    }
  };

  const handlePartSelection = (testId: string, part: 'part1' | 'part2') => {
    setSelectedTestId(testId);
    setSelectedPart(part);
    setModeModalOpen(true);
  };

  const handleModalClose = () => {
    setModeModalOpen(false);
    setSelectedTestId(null);
    setSelectedPart(null);
  };

  return (
    <>
      <Header />
      <main className="flex-grow pt-28 sm:pt-32 lg:pt-36 pb-16 sm:pb-24 lg:pb-32 bg-white">
        {/* ───── Page Header ───── */}
        <section className="container mx-auto px-4 sm:px-6 mb-12 sm:mb-16 lg:mb-20 relative">
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-10 items-end">
            <div className="lg:col-span-7">
              <span className="text-[11px] uppercase tracking-[0.22em] text-neutral-500 font-medium flex items-center gap-2 mb-4 sm:mb-6">
                <span className="w-6 h-px bg-neutral-900" />
                DGCA RTR(A)
              </span>
              <h1 className="font-display text-4xl sm:text-5xl md:text-7xl lg:text-8xl leading-[1] tracking-[-0.03em] text-neutral-900 mb-4 sm:mb-6">
                RTR mock <span className="italic-serif">exams.</span>
              </h1>
              <p className="text-neutral-600 text-base sm:text-lg leading-relaxed max-w-xl">
                Full RTR(A) exam simulation — Part 1 (MCQ, 2 hours) and Part 2 (RT Transmission, 25
                min). Exactly like the real WPC exam.
              </p>
            </div>

            <div className="lg:col-span-4 lg:col-start-9">
              <div className="border border-neutral-200 rounded-2xl p-5 sm:p-6 bg-neutral-50">
                <p className="text-[11px] uppercase tracking-[0.22em] text-neutral-500 font-medium flex items-center gap-2 mb-4">
                  <span className="w-6 h-px bg-neutral-900" />
                  DGCA RTR (R)
                </p>
                <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
                  <div className="text-neutral-500">Part 1</div>
                  <div className="text-neutral-900 font-medium">MCQ</div>
                  <div className="text-neutral-500">Part 2</div>
                  <div className="text-neutral-900 font-medium">RT Simulator</div>
                  <div className="text-neutral-500">Validity</div>
                  <div className="text-neutral-900 font-medium">Lifetime</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ───── Tests ───── */}
        <section className="container mx-auto px-4 sm:px-6">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              {[1, 2].map(i => (
                <div key={i} className="bg-white border border-neutral-200 rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10">
                  <div className="h-6 skeleton rounded mb-4 w-3/4" />
                  <div className="h-4 skeleton rounded mb-10 w-full" />
                  <div className="h-32 skeleton rounded-xl mb-4" />
                  <div className="h-32 skeleton rounded-xl mb-10" />
                  <div className="h-12 skeleton rounded-xl" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-24">
              <p className="text-rose-500 font-medium">{error}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              {tests.map((test, idx) => (
                <div
                  key={test.id}
                  className="group bg-white border border-neutral-200 rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10 flex flex-col hover:border-neutral-900 hover:shadow-[0_24px_48px_-24px_rgba(10,10,10,0.18)] transition-all duration-300"
                >
                  {/* Number + status */}
                  <div className="flex items-center justify-between mb-6 sm:mb-8">
                    <span className="text-[11px] tracking-[0.22em] uppercase text-neutral-400 font-mono">
                      Set {String(idx + 1).padStart(2, '0')}
                    </span>
                    {test.isPurchased ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-[10px] font-medium uppercase tracking-wider">
                        <CheckCircle2 className="w-3 h-3" />
                        Unlocked
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-100 text-neutral-600 border border-neutral-200/60 text-[10px] font-medium uppercase tracking-wider">
                        <Lock className="w-3 h-3" />
                        Locked
                      </span>
                    )}
                  </div>

                  <h3 className="font-display text-2xl sm:text-3xl text-neutral-900 mb-3 sm:mb-4 leading-tight">
                    {test.title}
                  </h3>
                  <p className="text-neutral-600 text-sm leading-relaxed mb-6 sm:mb-10">
                    {test.description}
                  </p>

                  {/* Parts breakdown */}
                  <div className="space-y-3 mb-6 sm:mb-10">
                    <div className="border border-neutral-200 rounded-2xl p-5 hover:border-neutral-300 transition-colors">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-neutral-100 text-neutral-900 flex items-center justify-center">
                            <FileText className="w-4 h-4" strokeWidth={1.5} />
                          </div>
                          <span className="font-medium text-neutral-900 text-sm">Part 1 — Written MCQ</span>
                        </div>
                        <span className="text-[10px] uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full">
                          {RTR_CONFIG.part1.totalQuestions} Qs
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-3 text-center">
                        {[
                          [RTR_CONFIG.part1.duration, 'min'],
                          [RTR_CONFIG.part1.totalMarks, 'marks'],
                          [RTR_CONFIG.part1.passingMarks, 'pass'],
                        ].map(([num, label]) => (
                          <div key={label}>
                            <p className="font-display text-2xl text-neutral-900 leading-none">{num}</p>
                            <p className="text-[10px] uppercase tracking-wider text-neutral-400 mt-1">{label}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="border border-neutral-200 rounded-2xl p-5 hover:border-neutral-300 transition-colors">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-neutral-900 text-white flex items-center justify-center">
                            <Radio className="w-4 h-4" strokeWidth={1.5} />
                          </div>
                          <span className="font-medium text-neutral-900 text-sm">Part 2 — RT Transmission</span>
                        </div>
                        <span className="text-[10px] uppercase tracking-wider text-neutral-900 bg-neutral-100 border border-neutral-200 px-2 py-0.5 rounded-full">
                          Scenarios
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-3 text-center">
                        {[
                          [RTR_CONFIG.part2.duration, 'min'],
                          [RTR_CONFIG.part2.totalMarks, 'marks'],
                          [RTR_CONFIG.part2.totalQuestions, 'scen.'],
                        ].map(([num, label]) => (
                          <div key={label}>
                            <p className="font-display text-2xl text-neutral-900 leading-none">{num}</p>
                            <p className="text-[10px] uppercase tracking-wider text-neutral-400 mt-1">{label}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Price + actions */}
                  <div className="mt-auto pt-5 sm:pt-6 border-t border-neutral-200">
                    <div className="flex items-baseline gap-2 mb-4 sm:mb-5">
                      <span className="font-display text-3xl sm:text-4xl text-neutral-900 tracking-tight">₹{test.price}</span>
                      <span className="text-xs text-neutral-400 uppercase tracking-wider">/ one-time</span>
                    </div>

                    {test.isPurchased ? (
                      <div className="grid grid-cols-2 gap-2">
                        <Button size="sm" variant="primary" onClick={() => handlePartSelection(test.id, 'part1')}>
                          Part 1
                        </Button>
                        <Button size="sm" variant="violet" onClick={() => handlePartSelection(test.id, 'part2')}>
                          Part 2
                        </Button>
                      </div>
                    ) : (
                      <Button
                        className="w-full"
                        onClick={() => handlePurchase(test.id)}
                        disabled={purchasing === test.id}
                      >
                        {purchasing === test.id ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Processing…
                          </>
                        ) : (
                          <>
                            Unlock for ₹{test.price}
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <ModeSelectionModal
        isOpen={modeModalOpen}
        testId={selectedTestId}
        part={selectedPart}
        onClose={handleModalClose}
      />

      <Footer />
    </>
  );
}
