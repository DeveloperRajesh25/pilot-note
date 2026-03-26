"use client";

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { GUIDES } from '@/app/constants/data';

export default function GuidesPage() {
  const [currentFilter, setCurrentFilter] = useState('all');
  const [activeGuideId, setActiveGuideId] = useState<string | null>(null);

  const categories = ['all', ...Array.from(new Set(GUIDES.map(g => g.category)))];

  const filteredGuides = currentFilter === 'all' 
    ? GUIDES 
    : GUIDES.filter(g => g.category === currentFilter);

  const activeGuide = GUIDES.find(g => g.id === activeGuideId);

  // Handle hash navigation
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash && hash.startsWith('#guide-')) {
        setActiveGuideId(hash.replace('#guide-', ''));
      } else {
        setActiveGuideId(null);
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const openGuide = (id: string) => {
    window.location.hash = `guide-${id}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const backToGuides = () => {
    window.location.hash = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <Header />
      <main className="flex-grow pt-32 pb-24 bg-neutral-50">
        <div className="container mx-auto px-6">
          {!activeGuide ? (
            <>
              {/* Listing Header */}
              <div className="max-w-3xl mb-16">
                <h1 className="text-4xl md:text-6xl font-black mb-6">Pilot Guides</h1>
                <p className="text-gray-500 text-lg">Comprehensive guides covering every aspect of your journey to becoming a commercial pilot in India.</p>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center justify-center gap-2 mb-12">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCurrentFilter(cat)}
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredGuides.map((guide) => (
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
                      <span className="text-xs text-gray-400 font-medium">{guide.readTime}</span>
                      <span className="text-gray-900 font-bold text-sm group-hover:text-violet">Read Guide →</span>
                    </div>
                  </div>
                ))}
                
                {filteredGuides.length === 0 && (
                  <div className="col-span-full py-20 text-center">
                    <p className="text-gray-400 text-lg">No guides in this category yet. Check back soon!</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Guide Detail View */}
              <div className="max-w-4xl mx-auto">
                <button onClick={backToGuides} className="group flex items-center gap-2 text-gray-500 font-bold mb-10 hover:text-black transition-colors">
                  <span className="transition-transform group-hover:-translate-x-1">←</span> Back to Guides
                </button>

                <article className="bg-white p-8 md:p-16 rounded-[3rem] shadow-xl border border-gray-100">
                  <div className="flex items-center gap-3 mb-8">
                    <span className="px-4 py-1.5 rounded-full bg-violet/10 text-violet text-[10px] font-black uppercase tracking-widest">{activeGuide.category}</span>
                    <span className="text-gray-300">•</span>
                    <span className="text-xs text-gray-400 font-medium">{activeGuide.readTime}</span>
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
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
