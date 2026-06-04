import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { SOCIAL_LINKS } from '@/app/constants/data';
import {
  Mail,
  MessageCircle,
  HelpCircle,
  Building2,
  ArrowUpRight,
} from 'lucide-react';
import { SOCIAL_ICON_MAP } from '@/components/ui/SocialIcons';
import { ContactForm } from '@/components/contact/ContactForm';

export const metadata: Metadata = {
  title: 'Contact — Pilot Note',
  description:
    'Get in touch with the Pilot Note team — support, partnerships, press, and feedback.',
};

const CHANNELS = [
  {
    icon: <HelpCircle className="w-5 h-5" strokeWidth={1.5} />,
    title: 'Support',
    desc: 'Help with your account, exam access, payments, or technical issues.',
    email: 'support@pilotnote.in',
  },
  {
    icon: <MessageCircle className="w-5 h-5" strokeWidth={1.5} />,
    title: 'Feedback & content',
    desc: 'Found an error in a question, or want to suggest a guide topic? We read every email.',
    email: 'feedback@pilotnote.in',
  },
  {
    icon: <Building2 className="w-5 h-5" strokeWidth={1.5} />,
    title: 'Partnerships & press',
    desc: 'Flying schools, instructors, media, and collaboration enquiries.',
    email: 'hello@pilotnote.in',
  },
  {
    icon: <Mail className="w-5 h-5" strokeWidth={1.5} />,
    title: 'Privacy & legal',
    desc: 'Data requests, takedown notices, and other legal matters.',
    email: 'privacy@pilotnote.in',
  },
];

export default function ContactPage() {
  return (
    <>
      <Header />
      <main className="grow bg-white">
        {/* Hero */}
        <section className="relative pt-28 sm:pt-32 lg:pt-36 pb-14 sm:pb-20 overflow-hidden border-b border-neutral-200">
          <div className="absolute inset-0 bg-grid opacity-60 pointer-events-none" />
          <div className="hidden md:block absolute top-1/3 -left-32 w-[420px] h-[420px] bg-emerald-100/30 rounded-full blur-[120px] pointer-events-none" />

          <div className="container mx-auto px-4 sm:px-6 relative">
            <div className="max-w-3xl">
              <span className="text-[11px] uppercase tracking-[0.22em] text-neutral-500 font-medium flex items-center gap-2 mb-4 sm:mb-6">
                <span className="w-6 h-px bg-neutral-900" /> Contact Pilot Note
              </span>
              <h1 className="font-display text-[clamp(2.5rem,9vw,4.5rem)] leading-[1.05] tracking-[-0.03em] text-neutral-900 mb-4 sm:mb-5">
                Let’s <span className="italic-serif">talk.</span>
              </h1>
              <p className="text-neutral-600 text-base sm:text-lg max-w-2xl leading-relaxed">
                We’re a small, focused team and we genuinely read every message. Pick the channel
                that fits and we’ll get back to you — usually within one working day.
              </p>
            </div>
          </div>
        </section>

        {/* Contact Form */}
        <section className="py-14 sm:py-20 border-b border-neutral-200">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="grid lg:grid-cols-12 gap-8 lg:gap-16 items-start">
              <div className="lg:col-span-4">
                <span className="text-[11px] uppercase tracking-[0.22em] text-neutral-500 font-medium flex items-center gap-2 mb-4 sm:mb-5">
                  <span className="w-6 h-px bg-neutral-900" /> Send a message
                </span>
                <h2 className="font-display text-3xl sm:text-4xl text-neutral-900 leading-[1.05] tracking-tight mb-4">
                  We read <span className="italic-serif">everything.</span>
                </h2>
                <p className="text-neutral-600 text-sm leading-relaxed">
                  Fill in the form and we&apos;ll route your message to the right person. Typical reply time is under 24 hours.
                </p>
              </div>
              <div className="lg:col-span-7 lg:col-start-6">
                <ContactForm />
              </div>
            </div>
          </div>
        </section>

        {/* Channels — email fallback */}
        <section className="py-14 sm:py-20">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="mb-8 sm:mb-10">
              <span className="text-[11px] uppercase tracking-[0.22em] text-neutral-500 font-medium flex items-center gap-2 mb-3">
                <span className="w-6 h-px bg-neutral-900" /> Or email us directly
              </span>
              <p className="text-neutral-600 text-sm max-w-lg">
                Prefer to write directly? Pick the address that fits your topic.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4 sm:gap-5">
              {CHANNELS.map((c) => (
                <a
                  key={c.email}
                  href={`mailto:${c.email}`}
                  className="group bg-white border border-neutral-200 rounded-2xl sm:rounded-3xl p-5 sm:p-7 hover:border-neutral-900 hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="flex items-start justify-between mb-4 sm:mb-5">
                    <div className="w-11 h-11 rounded-2xl bg-neutral-900 text-white flex items-center justify-center group-hover:bg-emerald-500 transition-colors">
                      {c.icon}
                    </div>
                    <ArrowUpRight
                      size={18}
                      className="text-neutral-300 group-hover:text-emerald-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all"
                    />
                  </div>
                  <h3 className="font-display text-lg sm:text-xl text-neutral-900 mb-2">{c.title}</h3>
                  <p className="text-neutral-600 text-sm leading-relaxed mb-3 sm:mb-4">{c.desc}</p>
                  <p className="text-sm font-medium text-emerald-600 group-hover:text-emerald-700 break-all">
                    {c.email}
                  </p>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* Office / social */}
        <section className="py-14 sm:py-20 border-t border-neutral-200 bg-neutral-50">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="grid lg:grid-cols-12 gap-8 sm:gap-12">
              <div className="lg:col-span-5">
                <span className="text-[11px] uppercase tracking-[0.22em] text-neutral-500 font-medium flex items-center gap-2 mb-4 sm:mb-5">
                  <span className="w-6 h-px bg-neutral-900" /> Where we are
                </span>
                <h2 className="font-display text-3xl sm:text-4xl text-neutral-900 leading-[1.05] tracking-tight mb-4 sm:mb-5">
                  Built in <span className="italic-serif">India</span>, for Indian skies.
                </h2>
                <p className="text-neutral-600 text-[15px] leading-relaxed mb-6">
                  Pilot Note operates fully online. For postal or legal correspondence, please use
                  the address below.
                </p>
                <div className="text-neutral-700 text-sm leading-relaxed">
                  <p className="font-medium text-neutral-900 mb-1">Pilot Note</p>
                  <p>Bengaluru, Karnataka</p>
                  <p>India</p>
                </div>
              </div>

              <div className="lg:col-span-6 lg:col-start-7">
                <span className="text-[11px] uppercase tracking-[0.22em] text-neutral-500 font-medium flex items-center gap-2 mb-4 sm:mb-5">
                  <span className="w-6 h-px bg-neutral-900" /> Follow along
                </span>
                <h2 className="font-display text-3xl sm:text-4xl text-neutral-900 leading-[1.05] tracking-tight mb-4 sm:mb-5">
                  Daily tips, real <span className="italic-serif">RT</span> calls, and aviation deep-dives.
                </h2>
                <p className="text-neutral-600 text-[15px] leading-relaxed mb-6">
                  We share study clips, RT phraseology drills, and pilot interviews across our
                  channels. Pick your favourite platform.
                </p>
                <div className="flex flex-wrap gap-3">
                  {SOCIAL_LINKS.map((s) => {
                    const Icon = SOCIAL_ICON_MAP[s.icon];
                    return (
                      <a
                        key={s.id}
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group inline-flex items-center gap-2.5 pl-3 pr-4 py-2.5 rounded-full bg-white border border-neutral-200 text-sm font-medium text-neutral-700 hover:text-white hover:bg-neutral-900 hover:border-neutral-900 transition-all duration-300"
                      >
                        <span className="w-7 h-7 rounded-full bg-neutral-100 group-hover:bg-emerald-500 flex items-center justify-center text-neutral-700 group-hover:text-white transition-colors">
                          {Icon && <Icon size={13} />}
                        </span>
                        {s.label}
                      </a>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer help */}
        <section className="py-12 sm:py-16 border-t border-neutral-200">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-5 text-sm">
              <p className="text-neutral-500">
                Looking for legal info? See{' '}
                <Link href="/privacy" className="text-neutral-900 underline underline-offset-4 hover:text-emerald-600">
                  Privacy
                </Link>
                ,{' '}
                <Link href="/terms" className="text-neutral-900 underline underline-offset-4 hover:text-emerald-600">
                  Terms
                </Link>{' '}
                or{' '}
                <Link href="/refund-policy" className="text-neutral-900 underline underline-offset-4 hover:text-emerald-600">
                  Refunds
                </Link>
                .
              </p>
              <p className="text-neutral-500">
                Typical reply time:{' '}
                <span className="text-neutral-900 font-medium">under 24 hours.</span>
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
