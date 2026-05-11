'use client'

import { useState } from 'react'
import { signup } from '@/app/actions/auth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import Link from 'next/link'
import { Loader2, CheckCircle2, ArrowRight, Mail } from 'lucide-react'

export function SignupForm() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    setMessage(null)
    const result = await signup(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    } else if (result?.message) {
      setMessage(result.message)
      setLoading(false)
    }
  }

  if (message) {
    return (
      <div className="w-full text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200/60 mb-7">
          <Mail className="w-7 h-7 text-emerald-600" strokeWidth={1.5} />
        </div>
        <h1 className="font-display text-4xl md:text-5xl leading-[0.95] tracking-[-0.03em] text-neutral-900 mb-4">
          Check your <span className="italic-serif">inbox.</span>
        </h1>
        <p className="text-neutral-500 leading-relaxed mb-10 text-[15px]">{message}</p>
        <Button href="/login" variant="secondary" className="w-full h-12">
          Back to sign in
        </Button>
      </div>
    )
  }

  return (
    <div className="w-full">
      <span className="text-[11px] uppercase tracking-[0.22em] text-neutral-500 font-medium flex items-center gap-2 mb-5">
        <span className="w-6 h-px bg-neutral-900" />
        Get started
      </span>
      <h1 className="font-display text-5xl md:text-6xl leading-[0.95] tracking-[-0.03em] text-neutral-900 mb-3">
        Create <span className="italic-serif">account.</span>
      </h1>
      <p className="text-neutral-500 mb-10 text-[15px]">
        Free forever. No credit card. India&apos;s #1 CPL platform.
      </p>

      <form action={handleSubmit} className="space-y-5">
        <Input
          label="Email"
          name="email"
          type="email"
          placeholder="you@example.com"
          required
          autoComplete="email"
        />
        <Input
          label="Password"
          name="password"
          type="password"
          placeholder="At least 6 characters"
          required
          minLength={6}
          autoComplete="new-password"
        />

        {error && (
          <div className="px-4 py-3 text-sm text-rose-700 bg-rose-50 rounded-xl border border-rose-200/60">
            {error}
          </div>
        )}

        <div className="pt-2">
          <Button type="submit" variant="primary" className="w-full h-12" disabled={loading}>
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Create account <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>

        <p className="text-xs text-neutral-400 text-center pt-1">
          By signing up, you agree to our{' '}
          <Link href="/terms" className="text-neutral-700 hover:text-neutral-900 underline underline-offset-2">
            Terms
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="text-neutral-700 hover:text-neutral-900 underline underline-offset-2">
            Privacy Policy
          </Link>
        </p>
      </form>

      {/* Feature checklist */}
      <ul className="mt-10 pt-8 border-t border-neutral-200 space-y-2.5">
        {[
          'DGCA RTR(A) mock exam suite',
          'COMPASS aptitude tests',
          'All-India Pariksha mock exams',
        ].map((item) => (
          <li key={item} className="flex items-center gap-2.5 text-sm text-neutral-600">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{item}</span>
          </li>
        ))}
      </ul>

      <div className="mt-8 text-center text-sm">
        <p className="text-neutral-500">
          Have an account?{' '}
          <Link
            href="/login"
            className="text-neutral-900 font-medium hover:text-emerald-600 transition-colors link-underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
