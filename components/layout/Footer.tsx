import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FOOTER_LINKS, SOCIAL_LINKS } from '@/app/constants/data';
import { ArrowUpRight } from 'lucide-react';
import { SOCIAL_ICON_MAP } from '@/components/ui/SocialIcons';

export const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="relative bg-white border-t border-neutral-200/70 overflow-hidden">
      {/* Big editorial wordmark backdrop */}
      <div className="absolute left-0 right-0 -bottom-2 sm:-bottom-12 pointer-events-none select-none overflow-hidden">
        <p
          className="font-display text-neutral-900/9 leading-[0.85] whitespace-nowrap text-center w-full"
          style={{ fontSize: 'clamp(5rem, 24vw, 600rem)', letterSpacing: '-0.02em' }}
        >
          Pilot Note
        </p>
      </div>

      <div className="container mx-auto px-4 sm:px-6 pt-16 sm:pt-20 lg:pt-24 pb-10 sm:pb-12 relative">
        {/* Top row: brand + columns */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-12 gap-x-6 gap-y-10 sm:gap-x-8 sm:gap-y-12 lg:gap-12 mb-12 sm:mb-16 lg:mb-20">
          {/* Brand */}
          <div className="col-span-2 lg:col-span-5">
            <Link href="/" className="inline-block mb-5 sm:mb-6">
              <Image
                src="/logo.png"
                alt="Pilot Note"
                width={180}
                height={42}
                className="h-9 w-auto"
              />
            </Link>
            <p className="text-neutral-600 max-w-md leading-relaxed text-sm sm:text-[15px] mb-6 sm:mb-8">
              India&apos;s DGCA CPL &amp; ATPL Mock Examination Platform.<br />
              Train. Compete. Rank. Succeed.
            </p>

            {/* Social links */}
            <div className="flex items-center gap-2.5">
              {SOCIAL_LINKS.map((s) => {
                const Icon = SOCIAL_ICON_MAP[s.icon];
                return (
                  <a
                    key={s.id}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    title={s.label}
                    className="w-9 h-9 flex items-center justify-center rounded-full border border-neutral-200 text-neutral-500 hover:text-white hover:bg-neutral-900 hover:border-neutral-900 transition-all duration-300"
                  >
                    {Icon && <Icon size={14} />}
                  </a>
                );
              })}
            </div>
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
        <div className="pt-6 sm:pt-8 border-t border-neutral-200 flex flex-col md:flex-row justify-between items-center gap-4 sm:gap-6 text-xs text-neutral-500 text-center md:text-left">
          <p>
            © {year} <span className="text-neutral-900 font-medium">Pilot Note</span>. All rights
            reserved.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 sm:gap-6">
            <Link href="/privacy" className="hover:text-neutral-900 transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-neutral-900 transition-colors">
              Terms
            </Link>
            <span className="flex items-center gap-1.5">
              <span>Crafted for </span>
              <span className="text-neutral-900 font-medium italic-serif">India&apos;s skies.</span>
            </span>
            <a
              href="https://webcros.in"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-neutral-900 transition-colors"
            >
              <span>Developed by </span>
              <span className="text-neutral-900 font-medium">Webcros</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
