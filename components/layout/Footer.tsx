import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FOOTER_LINKS } from '@/app/constants/data';

export const Footer = () => {
  return (
    <footer className="bg-neutral-50 border-t border-neutral-100 pt-20 pb-10">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
          {/* Brand Col */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center p-2.5 shadow-sm shadow-accent/10">
                <Image src="/assets/logo.svg" alt="Pilot Note" width={28} height={28} className="brightness-0" />
              </div>
              <span className="text-black font-heading font-extrabold text-2xl tracking-tight">Pilot Note</span>
            </Link>
            <p className="text-neutral-500 max-w-sm leading-relaxed text-lg">
              Your complete companion for CPL ground exams, aptitude tests, and pilot career guidance. Built by pilots, for aspiring pilots.
            </p>
          </div>

          {/* Links Cols */}
          {FOOTER_LINKS.map((group) => (
            <div key={group.id}>
              <h4 className="text-black font-bold mb-8 uppercase text-xs tracking-widest">{group.title}</h4>
              <ul className="flex flex-col gap-4">
                {group.links.map((link, idx) => (
                  <li key={idx}>
                    <Link href={link.url} className="text-neutral-500 hover:text-accent font-medium transition-all hover:translate-x-1 inline-block">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="pt-10 border-t border-neutral-200 flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-neutral-400 font-medium">
          <p>Copyright © 2024 — 2026 <span className="text-neutral-600">Pilot Note</span>. All rights reserved.</p>
          <div className="flex items-center gap-2">
            Made with <span className="text-red-500 animate-pulse">❤️</span> for India's future pilots
          </div>
        </div>
      </div>
    </footer>
  );
};
