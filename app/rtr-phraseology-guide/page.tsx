'use client';

import React, { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { convertToRTPhraseology, CONVERSION_EXAMPLES } from '@/lib/icao-rt-converter';
import { RTRHelpModal, RTRQuickReference } from '@/lib/rtr-help';

export default function RTRPhrasologyGuidePage() {
  const [inputText, setInputText] = useState('');
  const [convertedText, setConvertedText] = useState('');
  const [activeTab, setActiveTab] = useState<'converter' | 'guide' | 'reference'>('converter');

  const handleConvert = () => {
    const converted = convertToRTPhraseology(inputText);
    setConvertedText(converted);
  };

  const handleClear = () => {
    setInputText('');
    setConvertedText('');
  };

  return (
    <>
      <Header />
      <main className="grow min-h-screen bg-white pt-24 pb-16">
        <div className="container mx-auto px-6">
          {/* Hero Section */}
          <div className="mb-16 text-center">
            <span className="text-[11px] uppercase tracking-[0.22em] text-neutral-500 font-medium flex items-center justify-center gap-2 mb-5">
              <span className="w-6 h-px bg-neutral-900" /> RTR Part 2 Phraseology Helper
            </span>
            <h1 className="font-display text-5xl md:text-6xl text-neutral-900 mb-6 tracking-tight">
              ICAO Radiotelephony <span className="italic-serif">Phraseology Guide</span>
            </h1>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto mb-8">
              Master ICAO standard pilot-ATC communication. Convert aviation text to realistic RT phraseology used in real-world operations and CPL RTR exams.
            </p>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mb-8 border-b border-neutral-200 overflow-x-auto">
            {(['converter', 'guide', 'reference'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 font-medium text-sm uppercase tracking-[0.18em] border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab
                    ? 'border-neutral-900 text-neutral-900'
                    : 'border-transparent text-neutral-500 hover:text-neutral-900'
                }`}
              >
                {tab === 'converter' && 'Text Converter'}
                {tab === 'guide' && 'Learning Guide'}
                {tab === 'reference' && 'Quick Reference'}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === 'converter' && (
            <div className="max-w-4xl mx-auto space-y-8">
              {/* Converter Card */}
              <div className="border border-neutral-200 rounded-3xl p-8 md:p-12">
                <h2 className="font-display text-2xl text-neutral-900 mb-6">Real-time Converter</h2>
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-[11px] uppercase tracking-[0.22em] text-neutral-500 font-medium mb-3">
                      Your text (aviation phrases)
                    </label>
                    <textarea
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder="Example: 'Contact Delhi Tower on 121.5, descend to FL80, Runway 27 Left, squawk 1234'"
                      rows={5}
                      className="w-full border border-neutral-200 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-neutral-100 focus:border-neutral-900 outline-none transition-all"
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button variant="primary" onClick={handleConvert}>
                      Convert to RT Phraseology
                    </Button>
                    <Button variant="secondary" onClick={handleClear}>
                      Clear
                    </Button>
                  </div>
                </div>

                {convertedText && (
                  <div>
                    <label className="block text-[11px] uppercase tracking-[0.22em] text-neutral-500 font-medium mb-3">
                      ICAO RT Phraseology Output
                    </label>
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                      <p className="text-base text-emerald-900 leading-relaxed font-mono">{convertedText}</p>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(convertedText);
                        alert('Copied to clipboard!');
                      }}
                      className="mt-3 text-sm text-neutral-600 hover:text-neutral-900 underline"
                    >
                      Copy to clipboard
                    </button>
                  </div>
                )}
              </div>

              {/* Examples Grid */}
              <div>
                <h3 className="font-display text-2xl text-neutral-900 mb-6">Common Conversion Examples</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {CONVERSION_EXAMPLES.map((example, idx) => (
                    <div
                      key={idx}
                      className="border border-neutral-200 rounded-2xl p-5 hover:border-neutral-900 transition-colors cursor-pointer"
                      onClick={() => {
                        setInputText(example.input);
                        setTimeout(() => {
                          const converted = convertToRTPhraseology(example.input);
                          setConvertedText(converted);
                        }, 0);
                      }}
                    >
                      <span className="text-[10px] uppercase tracking-[0.18em] text-neutral-500 font-bold block mb-2">
                        {example.type}
                      </span>
                      <div className="space-y-2">
                        <div>
                          <span className="text-[10px] text-neutral-500 font-medium">Input:</span>
                          <p className="font-mono text-sm text-neutral-900 font-bold">{example.input}</p>
                        </div>
                        <div className="pt-2 border-t border-neutral-200">
                          <span className="text-[10px] text-neutral-500 font-medium">Output:</span>
                          <p className="font-mono text-sm text-emerald-700">{example.output}</p>
                        </div>
                      </div>
                      <p className="text-xs text-neutral-500 mt-3 italic">Click to try</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'guide' && (
            <div className="max-w-4xl mx-auto">
              <RTRHelpModal />
            </div>
          )}

          {activeTab === 'reference' && (
            <div className="max-w-4xl mx-auto">
              <h2 className="font-display text-2xl text-neutral-900 mb-8">Quick Reference</h2>
              <RTRQuickReference />
            </div>
          )}
        </div>

        {/* Tips Section */}
        <div className="mt-16 bg-violet-50 border-t border-violet-200">
          <div className="container mx-auto px-6 py-12">
            <h3 className="font-display text-2xl text-neutral-900 mb-8">Tips for RTR Part 2 Success</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-full bg-violet-200 flex items-center justify-center text-violet-900 font-bold text-lg">1</div>
                <h4 className="font-bold text-neutral-900">Master ICAO Numbers</h4>
                <p className="text-sm text-neutral-600">
                  The key to realistic RT communication is proper number pronunciation. Practice saying tree, fowe-er, fife, niner, and ait until it's second nature.
                </p>
              </div>
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-full bg-violet-200 flex items-center justify-center text-violet-900 font-bold text-lg">2</div>
                <h4 className="font-bold text-neutral-900">Use Standard Phraseology</h4>
                <p className="text-sm text-neutral-600">
                  Always use approved RT words like ROGER, WILCO, AFFIRM, NEGATIVE. Never use casual language like OK or yeah in RT communication.
                </p>
              </div>
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-full bg-violet-200 flex items-center justify-center text-violet-900 font-bold text-lg">3</div>
                <h4 className="font-bold text-neutral-900">Understand Context</h4>
                <p className="text-sm text-neutral-600">
                  Know when to use "Flight Level" vs plain numbers, when to say "Decimal" for frequencies, and how to structure readbacks correctly.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
