"use client";

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

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
      <main className="flex-grow pt-32 pb-24 bg-neutral-50">
        <div className="container mx-auto px-6">
          {guideLoading ? (
            <div className="max-w-4xl mx-auto">
              <div className="bg-white p-8 md:p-16 rounded-[3rem] border animate-pulse">
                <div className="h-6 bg-neutral-100 rounded w-32 mb-8" />
                <div className="h-10 bg-neutral-100 rounded w-3/4 mb-12" />
                <div className="space-y-4">
                  {[1,2,3,4,5].map(i => <div key={i} className="h-4 bg-neutral-100 rounded" style={{width: `${70 + Math.random()*30}%`}} />)}
                </div>
              </div>
            </div>
          ) : activeGuide ? (
            <>
              {/* Guide Detail */}
              <div className="max-w-4xl mx-auto">
                <button onClick={backToGuides} className="group flex items-center gap-2 text-gray-500 font-bold mb-10 hover:text-black transition-colors">
                  <span className="transition-transform group-hover:-translate-x-1">←</span> Back to Guides
                </button>
                <article className="bg-white p-8 md:p-16 rounded-[3rem] shadow-xl border border-gray-100">
                  <div className="flex items-center gap-3 mb-8">
                    <span className="px-4 py-1.5 rounded-full bg-violet/10 text-violet text-[10px] font-black uppercase tracking-widest">{activeGuide.category}</span>
                    <span className="text-gray-300">•</span>
                    <span className="text-xs text-gray-400 font-medium">{activeGuide.read_time}</span>
                    <span className="text-gray-300">•</span>
                    <span className="px-2 py-0.5 bg-neutral-100 text-neutral-500 text-[10px] font-bold rounded uppercase">{activeGuide.difficulty}</span>
                  </div>
                  <h1 className="text-3xl md:text-5xl font-black mb-10 leading-tight">{activeGuide.title}</h1>
                  <div
                    className="prose prose-neutral max-w-none text-gray-600 leading-relaxed
                      prose-h2:text-2xl prose-h2:font-black prose-h2:mt-12 prose-h2:mb-6 prose-h2:text-gray-900
                      prose-p:mb-6 prose-ul:mb-8 prose-li:mb-2 prose-strong:text-gray-900"
                    dangerouslySetInnerHTML={{ __html: activeGuide.content || '' }}
                  />
                </article>
              </div>
            </>
          ) : (
            <>
              {/* Listing */}
              <div className="max-w-3xl mb-16">
                <h1 className="text-4xl md:text-6xl font-black mb-6">Pilot Guides</h1>
                <p className="text-gray-500 text-lg">Comprehensive guides covering every aspect of your journey to becoming a commercial pilot in India.</p>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center justify-center gap-2 mb-12">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => handleFilterChange(cat)}
                    className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${
                      currentFilter === cat
                        ? 'bg-violet text-white shadow-lg shadow-violet-glow'
                        : 'bg-white text-gray-500 border border-gray-100 hover:border-violet/30'
                    }`}
                  >
                    {cat === 'all' ? 'All Guides' : cat}
                  </button>
                ))}
              </div>

              {/* Grid */}
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className="bg-white p-8 rounded-3xl border border-neutral-100 animate-pulse">
                      <div className="h-11 w-11 rounded-xl bg-neutral-100 mb-6" />
                      <div className="h-6 bg-neutral-100 rounded mb-4 w-4/5" />
                      <div className="space-y-2 mb-6">
                        <div className="h-3 bg-neutral-100 rounded" />
                        <div className="h-3 bg-neutral-100 rounded w-5/6" />
                        <div className="h-3 bg-neutral-100 rounded w-3/4" />
                      </div>
                      <div className="h-4 bg-neutral-100 rounded w-1/2" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {guides.map((guide) => (
                    <div
                      key={guide.id}
                      onClick={() => openGuide(guide.id)}
                      className="bg-white p-8 rounded-3xl border border-neutral-100 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-11 h-11 rounded-xl bg-violet/10 text-violet flex items-center justify-center">
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-violet">{guide.category}</span>
                      </div>
                      <h3 className="text-xl font-bold mb-4 group-hover:text-violet transition-colors">{guide.title}</h3>
                      <p className="text-gray-500 text-sm mb-6 leading-relaxed line-clamp-3">{guide.summary}</p>
                      <div className="flex items-center justify-between mt-auto pt-6 border-t border-gray-50">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400 font-medium">{guide.read_time}</span>
                          <span className="px-2 py-0.5 bg-neutral-100 text-neutral-500 text-[10px] font-bold rounded uppercase">{guide.difficulty}</span>
                        </div>
                        <span className="text-gray-900 font-bold text-sm group-hover:text-violet">Read Guide →</span>
                      </div>
                    </div>
                  ))}
                  {guides.length === 0 && (
                    <div className="col-span-full py-20 text-center">
                      <p className="text-gray-400 text-lg">No guides in this category yet. Check back soon!</p>
                    </div>
                  )}
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
