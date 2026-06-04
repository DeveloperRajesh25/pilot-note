'use client';

import React, { useState } from 'react';
import { submitContact } from '@/app/actions/contact';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loader2, ArrowRight, CheckCircle2 } from 'lucide-react';

const TOPICS = [
  { value: 'support',      label: 'Account, exam access, or payment help' },
  { value: 'feedback',     label: 'Question error or guide suggestion' },
  { value: 'partnerships', label: 'Partnership or press enquiry' },
  { value: 'privacy',      label: 'Privacy, data, or legal matter' },
];

export function ContactForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [sent, setSent]       = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await submitContact(formData);
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      setSent(true);
    }
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-12 sm:py-16 px-4">
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-5">
          <CheckCircle2 className="w-7 h-7 text-emerald-600" />
        </div>
        <h3 className="font-display text-2xl sm:text-3xl text-neutral-900 mb-2">Message sent.</h3>
        <p className="text-neutral-600 text-sm max-w-sm">
          We&apos;ll get back to you within one working day. Check your spam folder if you don&apos;t hear from us.
        </p>
      </div>
    );
  }

  return (
    <form action={handleSubmit} className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-4 sm:gap-5">
        <Input
          label="Your name"
          name="name"
          type="text"
          placeholder="Arjun Sharma"
          required
          autoComplete="name"
        />
        <Input
          label="Email address"
          name="email"
          type="email"
          placeholder="you@example.com"
          required
          autoComplete="email"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="topic"
          className="text-[11px] font-medium text-neutral-500 uppercase tracking-[0.14em]"
        >
          Topic
        </label>
        <select
          id="topic"
          name="topic"
          required
          defaultValue=""
          className="px-4 py-3.5 rounded-xl border border-neutral-200 hover:border-neutral-300 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-100 outline-none text-sm font-medium bg-white text-neutral-900 transition-all"
        >
          <option value="" disabled>Select a topic…</option>
          {TOPICS.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="message"
          className="text-[11px] font-medium text-neutral-500 uppercase tracking-[0.14em]"
        >
          Message
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          placeholder="Tell us what's on your mind…"
          className="px-4 py-3.5 rounded-xl border border-neutral-200 hover:border-neutral-300 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-100 outline-none text-sm font-medium bg-white text-neutral-900 placeholder:text-neutral-400 transition-all resize-none"
        />
      </div>

      {error && (
        <div className="px-4 py-3 text-sm text-rose-700 bg-rose-50 rounded-xl border border-rose-200/60">
          {error}
        </div>
      )}

      <Button type="submit" variant="primary" className="w-full sm:w-auto h-12" disabled={loading}>
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>Send message <ArrowRight className="w-4 h-4" /></>
        )}
      </Button>
    </form>
  );
}
