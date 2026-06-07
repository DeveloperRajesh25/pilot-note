"use client";

import { ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuthUser } from '@/components/layout/AuthProvider';

export function CtaActions() {
  const user = useAuthUser();
  const isAuthenticated = !!user;

  return (
    <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-center gap-3 sm:gap-4 max-w-sm sm:max-w-none mx-auto">
      <Button
        size="lg"
        variant="violet"
        href={isAuthenticated ? '/pariksha' : '/signup'}
        className="px-8 sm:px-10 h-14 justify-center"
      >
        {isAuthenticated ? 'Browse exams' : 'Start free'} <ArrowUpRight size={18} />
      </Button>
      <Button
        size="lg"
        variant="outline"
        href={isAuthenticated ? '/profile' : '/guides'}
        className="text-white border-white/30 hover:bg-white hover:text-neutral-900 hover:border-white px-8 sm:px-10 h-14 justify-center"
      >
        {isAuthenticated ? 'Open profile' : 'Read guides'}
      </Button>
    </div>
  );
}
