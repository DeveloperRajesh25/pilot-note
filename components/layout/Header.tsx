"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { NAV_LINKS } from '@/app/constants/data';
import { Button } from '@/components/ui/Button';

import { User as UserIcon, Menu, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { type User } from '@supabase/supabase-js';

export const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 16);
    window.addEventListener('scroll', handleScroll);

    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      subscription.unsubscribe();
    };
  }, [supabase.auth]);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled ? 'pt-3' : 'pt-5'
      }`}
    >
      <div className="container mx-auto px-3 sm:px-6">
        <div
          className={`relative flex items-center justify-between rounded-full transition-all duration-500 ${
            isScrolled
              ? 'bg-white/85 border border-neutral-200/70 shadow-[0_8px_30px_-12px_rgba(10,10,10,0.12)] backdrop-blur-xl py-2 px-3 sm:px-4'
              : 'bg-white/60 border border-neutral-200/50 backdrop-blur-md py-2.5 px-3 sm:px-5'
          }`}
        >
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 pl-1 group min-w-0">
            <div className="relative">
              <Image
                src="/logo.png"
                alt="Pilot Note"
                width={120}
                height={28}
                priority
                className="h-6 sm:h-7 w-auto object-contain transition-transform duration-500 group-hover:-translate-y-0.5"
              />
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-0.5 lg:gap-1 absolute left-1/2 -translate-x-1/2">
            {NAV_LINKS.map((link) => {
              const active = pathname === link.url || (link.url === '/' && pathname === '/');
              return (
                <Link
                  key={link.id}
                  href={link.url}
                  className={`relative px-3 lg:px-4 py-2 rounded-full text-[13px] font-medium transition-colors duration-300 ${
                    active ? 'text-neutral-900' : 'text-neutral-500 hover:text-neutral-900'
                  }`}
                >
                  {active && (
                    <span className="absolute inset-0 rounded-full bg-neutral-100" aria-hidden />
                  )}
                  <span className="relative flex items-center gap-1.5">
                    {link.label}
                    {link.comingSoon && (
                      <span className="text-[8px] font-bold uppercase tracking-wider bg-neutral-100 text-neutral-400 px-1.5 py-0.5 rounded-full leading-none">
                        Soon
                      </span>
                    )}
                  </span>
                  {active && (
                    <span className="absolute left-1/2 -translate-x-1/2 -bottom-0.5 w-1 h-1 rounded-full bg-emerald-500" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {!user && (
              <Link
                href="/login"
                className="hidden sm:inline-block text-neutral-700 text-[13px] font-medium hover:text-neutral-900 px-3 py-2 transition-colors"
              >
                Log in
              </Link>
            )}

            {user ? (
              <Link
                href="/profile"
                className="group w-10 h-10 rounded-full bg-neutral-900 text-white hover:bg-emerald-500 transition-all duration-300 flex items-center justify-center"
                title="Profile"
              >
                <UserIcon size={16} className="transition-transform group-hover:scale-110" />
              </Link>
            ) : (
              <Button href="/signup" size="sm" variant="primary" className="hidden sm:inline-flex">
                Get started
              </Button>
            )}

            {/* Mobile Toggle */}
            <button
              className="md:hidden w-10 h-10 flex items-center justify-center text-neutral-700 hover:bg-neutral-100 rounded-full transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-2 bg-white/95 backdrop-blur-xl rounded-3xl p-3 border border-neutral-200/70 shadow-xl animate-fade-in">
            <div className="flex flex-col gap-1 mb-3">
              {NAV_LINKS.map((link) => {
                const active = pathname === link.url;
                return (
                  <Link
                    key={link.id}
                    href={link.url}
                    className={`flex items-center justify-between px-4 py-3 rounded-2xl text-sm transition-colors ${
                      active
                        ? 'bg-neutral-900 text-white font-medium'
                        : 'text-neutral-700 hover:bg-neutral-100'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span className="flex items-center gap-2">
                      {link.label}
                      {link.comingSoon && (
                        <span className="text-[8px] font-bold uppercase tracking-wider bg-neutral-700 text-neutral-300 px-1.5 py-0.5 rounded-full leading-none">
                          Soon
                        </span>
                      )}
                    </span>
                    {active && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                  </Link>
                );
              })}
            </div>
            {!user && (
              <div className="flex gap-2 pt-3 border-t border-neutral-100">
                <Link
                  href="/login"
                  className="flex-1 text-center py-2.5 rounded-2xl text-sm font-medium text-neutral-700 hover:bg-neutral-100"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Log in
                </Link>
                <Button href="/signup" size="sm" className="flex-1">
                  Get started
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
