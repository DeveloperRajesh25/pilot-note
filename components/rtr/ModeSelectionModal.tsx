'use client';

import React from 'react';

interface ModeSelectionModalProps {
  isOpen: boolean;
  testId: string | null;
  part: 'part1' | 'part2' | null;
  onClose: () => void;
}

export function ModeSelectionModal({
  isOpen,
  testId,
  part,
  onClose,
}: ModeSelectionModalProps) {
  if (!isOpen || !part || !testId) return null;

  const partLabel = part === 'part1' ? 'Part 1 — Written MCQ' : 'Part 2 — RT Transmission';

  // Real, static URLs — no JS handler indirection, so Practice can never
  // resolve to the Simulate URL (and vice versa).
  const buildUrl = (mode: 'practice' | 'simulate') =>
    `/rtr-exam?testId=${encodeURIComponent(testId)}&part=${part}&mode=${mode}`;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-10 md:p-14 max-w-md w-full shadow-2xl my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-[11px] uppercase tracking-[0.22em] text-neutral-500 font-medium flex items-center justify-center gap-2 mb-5 sm:mb-6">
          <span className="w-6 h-px bg-neutral-900" /> Select Mode
        </span>

        <h2 className="font-display text-2xl sm:text-3xl text-neutral-900 mb-2 text-center">{partLabel}</h2>

        <p className="text-center text-sm text-neutral-600 mb-6 sm:mb-8">
          Choose how you want to practice
        </p>

        <div className="space-y-3">
          <a
            href={buildUrl('practice')}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="block w-full group relative overflow-hidden rounded-2xl bg-white border-2 border-neutral-200 hover:border-neutral-900 p-5 sm:p-6 transition-all text-left cursor-pointer no-underline"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0 group-hover:bg-emerald-100 transition-colors">
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-neutral-900 mb-1">Practice Mode</h3>
                <p className="text-xs text-neutral-600">Learn at your own pace with no time pressure</p>
                <div className="mt-2 flex gap-2 flex-wrap">
                  <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded font-medium">No time limit</span>
                  <span className="text-[10px] bg-neutral-100 text-neutral-700 px-2 py-1 rounded font-medium">Flexible</span>
                </div>
              </div>
            </div>
          </a>

          <a
            href={buildUrl('simulate')}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="block w-full group relative overflow-hidden rounded-2xl bg-white border-2 border-neutral-200 hover:border-neutral-900 p-5 sm:p-6 transition-all text-left cursor-pointer no-underline"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-violet-50 flex items-center justify-center shrink-0 group-hover:bg-violet-100 transition-colors">
                <svg className="w-6 h-6 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-neutral-900 mb-1">Simulate Mode</h3>
                <p className="text-xs text-neutral-600">Real exam experience with actual time limits</p>
                <div className="mt-2 flex gap-2 flex-wrap">
                  <span className="text-[10px] bg-violet-100 text-violet-700 px-2 py-1 rounded font-medium">Timed exam</span>
                  <span className="text-[10px] bg-neutral-100 text-neutral-700 px-2 py-1 rounded font-medium">Realistic</span>
                </div>
              </div>
            </div>
          </a>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full mt-6 text-sm text-neutral-600 hover:text-neutral-900 transition-colors py-2 font-medium cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
