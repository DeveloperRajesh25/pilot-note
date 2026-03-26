"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { NAV_LINKS } from '@/app/constants/data';
import { Button } from '@/components/ui/Button';

export const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'py-3' : 'py-5'}`}>
      <div className="container mx-auto px-6">
        <div className={`flex items-center justify-between bg-neutral-900/90 rounded-full py-2.5 px-6 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-neutral-800/50 backdrop-blur-xl transition-all duration-300`}>
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center p-2 transition-all hover:scale-105 hover:rotate-3 shadow-lg shadow-accent/20">
              <Image src="/assets/logo.svg" alt="Pilot Note Logo" width={28} height={28} className="brightness-0" />
            </div>
            <span className="text-white font-heading font-extrabold text-xl hidden lg:block tracking-tight text-white leading-none">Pilot Note</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-2 lg:gap-4">
            {NAV_LINKS.map((link) => (
              <Link 
                key={link.id} 
                href={link.url}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
                  pathname === link.url || (link.url === '/' && pathname === '/')
                    ? 'text-accent bg-accent/10 border border-accent/20' 
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2 md:gap-4 shrink-0">
            <Link href="/login" className="text-white/80 text-sm font-bold hover:text-white px-3 transition-colors hidden sm:block">
              Log In
            </Link>
            <Button size="sm" variant="secondary" className="bg-white text-black border-none hover:bg-accent hover:text-black font-bold h-10 px-6">
              Get Started
            </Button>
            
            {/* Mobile Toggle */}
            <button 
              className="md:hidden text-white p-2 hover:bg-white/10 rounded-full transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className="text-2xl leading-none">{mobileMenuOpen ? '✕' : '☰'}</span>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-3 bg-neutral-900 rounded-2xl p-4 shadow-2xl border border-neutral-800 border-t-0 animate-in fade-in slide-in-from-top-4">
            <div className="flex flex-col gap-2">
              {NAV_LINKS.map((link) => (
                <Link 
                  key={link.id} 
                  href={link.url}
                  className={`px-4 py-3 rounded-xl text-base font-medium transition-colors ${
                    pathname === link.url 
                      ? 'text-accent bg-white/10' 
                      : 'text-white/70 hover:text-white hover:bg-white/5'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
