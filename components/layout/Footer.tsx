import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FOOTER_LINKS } from '@/app/constants/data';
import { ArrowUpRight } from 'lucide-react';

export const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="relative bg-white border-t border-neutral-200/70 overflow-hidden">
      {/* Big editorial wordmark backdrop */}
      <div className="absolute left-0 right-0 -bottom-10 sm:-bottom-16 pointer-events-none select-none overflow-hidden">
        <p
          className="font-display text-neutral-900/4 leading-[0.85] whitespace-nowrap text-center"
          style={{ fontSize: 'clamp(8rem, 22vw, 22rem)' }}
        >
          Pilot Note
        </p>
      </div>

      <div className="container mx-auto px-6 pt-24 pb-12 relative">
        {/* Top row: brand + columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 mb-20">
          {/* Brand */}
          <div className="lg:col-span-5">
            <Link href="/" className="inline-block mb-6">
              <Image
                src="/logo.png"
                alt="Pilot Note"
                width={180}
                height={42}
                className="h-9 w-auto"
              />
            </Link>
            <p className="text-neutral-600 max-w-md leading-relaxed text-[15px] mb-8">
              The complete companion for CPL ground exams, aptitude tests, and pilot career guidance —
              built by pilots, for the ones who&apos;ll fly next.
            </p>
            
          </div>

          {/* Link columns */}
          {FOOTER_LINKS.map((group) => (
            <div key={group.id} className="lg:col-span-2">
              <h4 className="text-neutral-900 text-[11px] font-medium mb-5 uppercase tracking-[0.18em]">
                {group.title}
              </h4>
              <ul className="flex flex-col gap-3">
                {group.links.map((link, idx) => (
                  <li key={idx}>
                    <Link
                      href={link.url}
                      className="group text-neutral-500 hover:text-neutral-900 text-sm font-medium transition-colors inline-flex items-center gap-1.5"
                    >
                      <span className="link-underline">{link.label}</span>
                      <ArrowUpRight
                        size={12}
                        className="opacity-0 group-hover:opacity-100 text-emerald-500 -translate-x-1 group-hover:translate-x-0 transition-all duration-300"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Newsletter / CTA */}
          <div className="lg:col-span-1 hidden lg:block" />
        </div>

        {/* Divider + bottom bar */}
        <div className="pt-8 border-t border-neutral-200 flex flex-col md:flex-row justify-between items-center gap-6 text-xs text-neutral-500">
          <p>
            © {year} <span className="text-neutral-900 font-medium">Pilot Note</span>. All rights
            reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-neutral-900 transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-neutral-900 transition-colors">
              Terms
            </Link>
            <span className="flex items-center gap-1.5">
              <span>Crafted for </span>
              <span className="text-neutral-900 font-medium italic-serif">India&apos;s sky.</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
