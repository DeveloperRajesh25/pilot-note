import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { SketchCanvas } from '@/components/ui/SketchCanvas';
import { HERO_CONTENT, FEATURES, STATS, WHY_US } from '@/app/constants/data';

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative min-h-[100dvh] flex items-center overflow-hidden bg-white pt-20 pb-10">
          <div className="container mx-auto px-6 relative z-10">
            <div className="flex flex-col lg:flex-row items-center gap-20">
              <div className="lg:w-1/2 text-center lg:text-left">
                <span className="inline-block px-4 py-2 bg-accent/10 text-accent-dark text-xs font-bold rounded-full uppercase tracking-widest mb-8 border border-accent/20">
                  {HERO_CONTENT.badge}
                </span>
                <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-8 leading-[1.05] tracking-tight text-neutral-900">
                  One stop solution for <span className="text-accent">CPL</span> <span className="text-violet">Pilots</span>
                </h1>
                <p className="text-xl text-neutral-500 mb-12 leading-relaxed max-w-2xl mx-auto lg:mx-0 font-medium">
                  {HERO_CONTENT.subtitle}
                </p>
                <div className="flex flex-wrap justify-center lg:justify-start gap-4 mb-10">
                  <Button variant="primary" size="lg" href="/dgca-rtr" className="h-14 px-10">Start Learning →</Button>
                  <Button variant="secondary" size="lg" href="/pariksha" className="h-14 px-10 border-neutral-200">Take an Exam</Button>
                </div>
              </div>

              <div className="lg:w-1/2 relative w-full max-w-2xl">
                <div className="relative z-10 bg-neutral-900 p-5 rounded-[3rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.3)] transform lg:rotate-2 hover:rotate-0 transition-all duration-700 border border-neutral-800 ring-8 ring-neutral-100/50">
                  <div className="w-16 h-1.5 bg-neutral-800 rounded-full mx-auto mb-5" />
                  <div className="aspect-[4/3] relative bg-white rounded-[2.5rem] overflow-hidden border border-neutral-100 p-2 sm:p-5">
                    <SketchCanvas />
                  </div>
                </div>
                {/* Decorative Elements */}
                <div className="absolute -top-12 -right-12 w-48 h-48 bg-violet/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-accent/10 rounded-full blur-3xl opacity-60 animate-pulse delay-700" />
                <div className="absolute top-1/2 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl" />
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-32 bg-neutral-50" id="features">
          <div className="container mx-auto px-6">
            <div className="text-center max-w-4xl mx-auto mb-20">
              <span className="text-accent font-black tracking-[0.2em] uppercase text-xs mb-5 block">What We Offer</span>
              <h2 className="text-4xl md:text-6xl font-black mb-8 text-neutral-900 tracking-tight">Everything You Need to <span className="text-gradient">Clear CPL</span></h2>
              <p className="text-neutral-500 text-xl font-medium max-w-2xl mx-auto">Four powerful tools designed for aspiring commercial pilots. Practice, learn, compete, and assess your readiness.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {FEATURES.map((feature, idx) => (
                <Link key={feature.id} href={feature.linkUrl} className="group p-10 rounded-[2.5rem] bg-white border border-neutral-100 shadow-sm hover:shadow-2xl hover:-translate-y-3 transition-all duration-500 flex flex-col items-start h-full">
                  <div className={`w-16 h-16 rounded-2xl mb-8 flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-110 group-hover:rotate-3
                    ${feature.id === 'f1' ? 'bg-gradient-to-br from-green-400 to-green-600 shadow-green-500/20' : 
                      feature.id === 'f2' ? 'bg-gradient-to-br from-violet-400 to-violet-600 shadow-violet-500/20' : 
                      feature.id === 'f3' ? 'bg-gradient-to-br from-blue-400 to-blue-600 shadow-blue-500/20' : 
                      'bg-gradient-to-br from-orange-400 to-orange-600 shadow-orange-500/20'}`}>
                    <span className="w-8 h-8 flex items-center justify-center font-black text-xl">{idx + 1}</span>
                  </div>
                  <h3 className="text-2xl font-black mb-4 text-neutral-900">{feature.title}</h3>
                  <p className="text-neutral-500 mb-8 leading-relaxed font-medium text-sm flex-grow">{feature.desc}</p>
                  <div className="flex items-center gap-2 text-neutral-900 font-bold text-sm group-hover:text-accent transition-colors">
                    <span>{feature.linkText}</span>
                    <span className="transform group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-32 bg-neutral-900 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-accent rounded-full blur-[120px]" />
            <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] bg-violet rounded-full blur-[120px]" />
          </div>
          <div className="container mx-auto px-6 relative z-10 text-center">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-16 lg:gap-8">
              {STATS.map((stat) => (
                <div key={stat.id} className="group">
                  <div className="text-6xl md:text-7xl font-black mb-3 text-accent transition-transform group-hover:scale-110 duration-500">
                    {stat.target.toLocaleString()}{stat.suffix}
                  </div>
                  <div className="text-neutral-400 font-bold uppercase tracking-[0.2em] text-xs">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="py-32 bg-white" id="why">
          <div className="container mx-auto px-6">
             <div className="max-w-4xl mb-24 text-center lg:text-left mx-auto lg:mx-0">
              <span className="text-violet font-black tracking-[0.2em] uppercase text-xs mb-5 block">Why Pilot Note</span>
              <h2 className="text-4xl md:text-6xl font-black mb-8 text-neutral-900 tracking-tight">Why Students Choose <span className="text-violet">Us</span></h2>
              <p className="text-neutral-500 text-xl font-medium max-w-2xl">Built by pilots, for aspiring pilots. We understand every challenge of your aviation journey.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {WHY_US.map((item) => (
                <div key={item.id} className="flex flex-col sm:flex-row gap-8 p-10 rounded-[2.5rem] bg-neutral-50 border border-neutral-100 hover:bg-white hover:shadow-xl transition-all duration-500">
                  <div className="text-6xl font-black text-neutral-200 shrink-0 leading-none">{item.number}</div>
                  <div>
                    <h4 className="text-2xl font-black mb-4 text-neutral-900 leading-tight">{item.title}</h4>
                    <p className="text-neutral-500 leading-relaxed font-medium">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-40 bg-neutral-900 text-white text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--color-accent-glow)_0%,_transparent_70%)] opacity-30" />
          <div className="container mx-auto px-6 relative z-10">
            <span className="text-accent font-black tracking-[0.2em] uppercase text-xs mb-6 block">Join Pilot Note</span>
            <h2 className="text-5xl md:text-8xl font-black mb-10 max-w-4xl mx-auto leading-[0.95] tracking-tighter">Start Your Pilot Journey Today</h2>
            <p className="text-neutral-400 text-xl mb-16 max-w-2xl mx-auto font-medium">Trusted by 12,500+ student pilots across India. Your complete CPL preparation companion.</p>
            <Button size="lg" className="h-16 px-12 text-lg shadow-2xl">Get Started with Pilot Note →</Button>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
