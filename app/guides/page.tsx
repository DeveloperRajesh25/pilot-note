"use client";

import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ArrowLeft, ArrowUpRight, BookOpen } from 'lucide-react';

interface Guide {
  id: string;
  title: string;
  category: string;
  summary: string;
  read_time: string;
  difficulty: string;
}

interface GuideDetail extends Guide {
  content: string;
}

export default function GuidesPage() {
  const [guides, setGuides] = useState<Guide[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentFilter, setCurrentFilter] = useState('all');
  const [activeGuide, setActiveGuide] = useState<GuideDetail | null>(null);
  const [guideLoading, setGuideLoading] = useState(false);

  const fetchGuides = async (category?: string) => {
    setLoading(true);
    try {
      const url = category && category !== 'all'
        ? `/api/guides?category=${encodeURIComponent(category)}`
        : '/api/guides';
      const res = await fetch(url);
      const data = await res.json();
      setGuides(data.guides ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchGuides(); }, []);

  const categories = ['all', ...Array.from(new Set(guides.map((g) => g.category)))];

  const handleFilterChange = (cat: string) => {
    setCurrentFilter(cat);
    fetchGuides(cat);
  };

  const openGuide = async (id: string) => {
    setGuideLoading(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    try {
      const res = await fetch(`/api/guides/${id}`);
      const data = await res.json();
      setActiveGuide(data.guide ?? null);
    } finally {
      setGuideLoading(false);
    }
  };

  const backToGuides = () => {
    setActiveGuide(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <Header />
      <main className="grow pt-28 sm:pt-32 lg:pt-36 pb-16 sm:pb-24 lg:pb-32 bg-white">
        <div className="container mx-auto px-4 sm:px-6">
          {guideLoading ? (
            <div className="max-w-3xl mx-auto">
              <div className="space-y-5">
                <div className="h-8 skeleton rounded w-40" />
                <div className="h-14 skeleton rounded w-3/4" />
                <div className="space-y-3 pt-6">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="h-4 skeleton rounded" style={{ width: `${70 + Math.random() * 30}%` }} />
                  ))}
                </div>
              </div>
            </div>
          ) : activeGuide ? (
            // ───── Article view ─────
            <div className="max-w-3xl mx-auto">
              <button
                onClick={backToGuides}
                className="group inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-900 mb-6 sm:mb-10 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
                Back to guides
              </button>

              <article>
                <div className="flex items-center gap-2 sm:gap-3 mb-6 sm:mb-8 flex-wrap text-[11px] uppercase tracking-[0.18em] font-medium">
                  <span className="px-2.5 py-1 sm:px-3 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                    {activeGuide.category}
                  </span>
                </div>

                <h1 className="font-display text-3xl sm:text-4xl md:text-6xl lg:text-7xl leading-[1.05] sm:leading-[0.95] tracking-[-0.03em] text-neutral-900 mb-8 sm:mb-12">
                  {activeGuide.title}
                </h1>

                <div className="guide-prose max-w-none text-neutral-700">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      a: ({ href, children, ...props }) => (
                        <a
                          href={href}
                          target={href?.startsWith('http') ? '_blank' : undefined}
                          rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
                          {...props}
                        >
                          {children}
                        </a>
                      ),
                    }}
                  >
                    {activeGuide.content || ''}
                  </ReactMarkdown>
                </div>
              </article>
            </div>
          ) : (
            <>
              {/* ───── Listing header ───── */}
              <div className="grid lg:grid-cols-12 gap-6 lg:gap-10 mb-10 sm:mb-16 items-end">
                <div className="lg:col-span-7">
                  <span className="text-[11px] uppercase tracking-[0.22em] text-neutral-500 font-medium flex items-center gap-2 mb-4 sm:mb-6">
                    <span className="w-6 h-px bg-neutral-900" />
                    Pilot Guides
                  </span>
                  <h1 className="font-display text-4xl sm:text-5xl md:text-7xl lg:text-8xl leading-[1.02] sm:leading-[0.95] tracking-[-0.03em] text-neutral-900">
                    Read your way to <span className="italic-serif">the cockpit.</span>
                  </h1>
                </div>
                <div className="lg:col-span-4 lg:col-start-9">
                  <p className="text-neutral-600 text-base sm:text-lg leading-relaxed">
                    Comprehensive guides covering every aspect of your journey to becoming a commercial pilot in India.
                  </p>
                </div>
              </div>

              {/* ───── Filters ───── */}
              <div className="flex flex-wrap items-center gap-2 mb-10 sm:mb-16 pb-6 sm:pb-8 border-b border-neutral-200">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => handleFilterChange(cat)}
                    className={`px-4 py-2 rounded-full text-xs font-medium transition-all uppercase tracking-[0.14em] ${
                      currentFilter === cat
                        ? 'bg-neutral-900 text-white border border-neutral-900'
                        : 'bg-white text-neutral-600 border border-neutral-200 hover:border-neutral-900 hover:text-neutral-900'
                    }`}
                  >
                    {cat === 'all' ? 'All Guides' : cat}
                  </button>
                ))}
              </div>

              {/* ───── Grid ───── */}
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="bg-white border border-neutral-200 rounded-2xl sm:rounded-3xl p-6 sm:p-8">
                      <div className="h-8 skeleton rounded w-24 mb-6 sm:mb-8" />
                      <div className="h-6 skeleton rounded w-4/5 mb-3" />
                      <div className="space-y-2 mb-6 sm:mb-8">
                        <div className="h-3 skeleton rounded" />
                        <div className="h-3 skeleton rounded w-5/6" />
                      </div>
                      <div className="h-4 skeleton rounded w-1/2" />
                    </div>
                  ))}
                </div>
              ) : guides.length === 0 ? (
                <div className="border border-neutral-200 rounded-2xl sm:rounded-3xl py-16 sm:py-24 px-4 text-center">
                  <BookOpen className="w-10 h-10 text-neutral-300 mx-auto mb-4" strokeWidth={1.5} />
                  <p className="text-neutral-500">No guides in this category yet. Check back soon.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                  {guides.map((guide, idx) => (
                    <button
                      key={guide.id}
                      onClick={() => openGuide(guide.id)}
                      className="group bg-white border border-neutral-200 rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10 text-left transition-all duration-300 hover:border-neutral-900 hover:shadow-[0_24px_48px_-24px_rgba(10,10,10,0.18)] flex flex-col h-full"
                    >
                      <div className="flex items-center justify-between mb-6 sm:mb-10">
                        <span className="text-[10px] uppercase tracking-[0.18em] text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2.5 py-1 rounded-full font-medium">
                          {guide.category}
                        </span>
                        <span className="text-[11px] tracking-[0.22em] uppercase text-neutral-400 font-mono">
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                      </div>

                      <h3 className="font-display text-xl sm:text-2xl md:text-3xl text-neutral-900 mb-3 sm:mb-4 leading-tight">
                        {guide.title}
                      </h3>
                      <p className="text-neutral-600 text-sm leading-relaxed mb-6 sm:mb-8 line-clamp-3">
                        {guide.summary}
                      </p>

                      <div className="mt-auto flex items-center justify-end pt-5 sm:pt-6 border-t border-neutral-100">
                        <ArrowUpRight
                          className="w-5 h-5 text-neutral-400 group-hover:text-emerald-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all shrink-0"
                        />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
