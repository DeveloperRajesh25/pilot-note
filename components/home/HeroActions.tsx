"use client";

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowUpRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuthUser } from '@/components/layout/AuthProvider';

export function HeroActions() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [, startTransition] = useTransition();
  const user = useAuthUser();
  const isAuthenticated = !!user;

  const primaryHref = isAuthenticated ? '/profile' : '/signup';

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
      {isAuthenticated ? (
        <Button variant="violet" size="lg" href={primaryHref}>
          Open profile
          <ArrowUpRight size={16} />
        </Button>
      ) : (
        <Button
          variant="violet"
          size="lg"
          type="button"
          disabled={pending}
          onClick={() => {
            setPending(true);
            startTransition(() => {
              router.push(primaryHref);
            });
          }}
        >
          {pending ? 'Opening…' : 'Start free'}
          {pending ? <Loader2 size={16} className="animate-spin" /> : <ArrowUpRight size={16} />}
        </Button>
      )}

      <Button variant="secondary" size="lg" href={isAuthenticated ? '/pariksha' : '/guides'}>
        {isAuthenticated ? 'Browse exams' : 'Read guides'}
      </Button>
    </div>
  );
}