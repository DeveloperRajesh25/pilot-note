'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { KeyRound, Loader2, ShieldCheck } from 'lucide-react';

function ParikshaLoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const examHint = params.get('exam') ?? undefined;

  const [rollNo, setRollNo] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const clean = rollNo.trim().toUpperCase();
    const pw = password.trim();
    if (!clean) { setError('Enter your roll number.'); return; }
    if (!/^\d{8}$/.test(pw)) { setError('Password should be 8 digits in DDMMYYYY format.'); return; }

    setBusy(true);
    try {
      const res = await fetch('/api/pariksha/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roll_no: clean, password: pw, exam_id: examHint }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? 'Login failed.');
        setBusy(false);
        return;
      }
      router.replace(data.redirect ?? `/pariksha/${data.exam_id}`);
    } catch {
      setError('Network error. Try again.');
      setBusy(false);
    }
  };

  return (
    <>
      <Header />
      <main className="grow pt-32 sm:pt-36 pb-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 max-w-md">
          <span className="text-[11px] uppercase tracking-[0.22em] text-neutral-500 font-medium flex items-center gap-2 mb-5">
            <span className="w-6 h-px bg-neutral-900" /> Pariksha · Exam login
          </span>
          <h1 className="font-display text-4xl sm:text-5xl text-neutral-900 leading-[1.05] tracking-[-0.03em] mb-3">
            Enter the hall.
          </h1>
          <p className="text-neutral-600 text-[15px] mb-8 leading-relaxed">
            Use the roll number and password emailed to you. Password is your date of birth
            in <code className="font-mono text-neutral-900">DDMMYYYY</code> format.
          </p>

          <form onSubmit={handleSubmit} className="border border-neutral-200 rounded-3xl p-6 sm:p-8 bg-white space-y-5">
            <div>
              <label className="block text-[11px] uppercase tracking-[0.18em] text-neutral-500 font-semibold mb-2">
                Roll number
              </label>
              <input
                type="text"
                inputMode="text"
                autoComplete="username"
                autoCapitalize="characters"
                spellCheck={false}
                value={rollNo}
                onChange={(e) => setRollNo(e.target.value)}
                placeholder="PIL-AN-2026-0001"
                className="w-full bg-white border border-neutral-300 text-neutral-900 rounded-2xl px-4 py-3.5 font-mono text-[15px] tracking-[0.04em] focus:outline-none focus:border-neutral-900 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-[0.18em] text-neutral-500 font-semibold mb-2">
                Password (DDMMYYYY)
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  inputMode="numeric"
                  autoComplete="current-password"
                  pattern="\d{8}"
                  maxLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="14032002"
                  className="w-full bg-white border border-neutral-300 text-neutral-900 rounded-2xl px-4 py-3.5 pr-20 font-mono text-[15px] tracking-[0.08em] focus:outline-none focus:border-neutral-900 focus:ring-2 focus:ring-emerald-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] uppercase tracking-[0.18em] font-semibold text-neutral-500 hover:text-neutral-900"
                >
                  {showPw ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-2xl px-4 py-3">
                {error}
              </div>
            )}

            <Button variant="violet" size="lg" type="submit" disabled={busy} className="w-full">
              {busy ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifying…</> : <><KeyRound className="w-4 h-4" /> Enter exam</>}
            </Button>
          </form>

          <div className="mt-6 border border-neutral-200 rounded-2xl p-5 bg-neutral-50 flex gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" strokeWidth={1.5} />
            <p className="text-[12.5px] text-neutral-700 leading-relaxed">
              Already signed into your Pilot Note account?{' '}
              <Link href="/pariksha" className="text-neutral-900 font-semibold underline-offset-2 hover:underline">
                Continue from the exams page →
              </Link>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

export default function ParikshaLoginPage() {
  return (
    <Suspense fallback={<div className="pt-40 text-center text-neutral-500">Loading…</div>}>
      <ParikshaLoginInner />
    </Suspense>
  );
}
