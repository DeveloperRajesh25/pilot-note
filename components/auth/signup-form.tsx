'use client'

import { useEffect, useState } from 'react'
import { signup, resendConfirmation } from '@/app/actions/auth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import Link from 'next/link'
import { Loader2, CheckCircle2, ArrowRight, MailCheck } from 'lucide-react'

export function SignupForm() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [pendingEmail, setPendingEmail] = useState<string | null>(null)
  const [maxDob, setMaxDob] = useState('')
  const [resendState, setResendState] = useState<{
    loading: boolean
    message: string | null
    error: string | null
  }>({ loading: false, message: null, error: null })

  // Set max DOB to today client-side to avoid SSR/CSR hydration mismatch.
  useEffect(() => {
    setMaxDob(new Date().toISOString().slice(0, 10))
  }, [])

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    const email = (formData.get('email') as string)?.trim().toLowerCase() || null
    const result = await signup(formData)
    setLoading(false)
    if (result?.error) {
      setError(result.error)
      return
    }
    if (result?.success) {
      setPendingEmail(email)
    }
  }

  async function handleResend() {
    if (!pendingEmail) return
    setResendState({ loading: true, message: null, error: null })
    const fd = new FormData()
    fd.set('email', pendingEmail)
    const result = await resendConfirmation(fd)
    setResendState({
      loading: false,
      message: result?.message ?? null,
      error: result?.error ?? null,
    })
  }

  if (pendingEmail) {
    return (
      <div className="w-full">
        <span className="text-[11px] uppercase tracking-[0.22em] text-neutral-500 font-medium flex items-center gap-2 mb-5">
          <span className="w-6 h-px bg-neutral-900" />
          One more step
        </span>
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-6">
          <MailCheck className="w-7 h-7 text-emerald-600" />
        </div>
        <h1 className="font-display text-4xl md:text-5xl leading-[0.95] tracking-[-0.03em] text-neutral-900 mb-3">
          Check your <span className="italic-serif">email.</span>
        </h1>
        <p className="text-neutral-600 mb-2 text-[15px]">
          We sent a confirmation link to{' '}
          <span className="font-medium text-neutral-900">{pendingEmail}</span>.
        </p>
        <p className="text-neutral-500 mb-8 text-[14px]">
          Click the link to activate your account, then sign in. The link is valid for 24 hours.
        </p>

        <div className="space-y-3">
          <Link href="/login" className="block">
            <Button variant="primary" className="w-full h-12">
              Go to sign in <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>

          <Button
            type="button"
            variant="secondary"
            className="w-full h-12"
            onClick={handleResend}
            disabled={resendState.loading}
          >
            {resendState.loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              'Resend confirmation email'
            )}
          </Button>
        </div>

        {resendState.message && (
          <div className="mt-4 px-4 py-3 text-sm text-emerald-700 bg-emerald-50 rounded-xl border border-emerald-200/60">
            {resendState.message}
          </div>
        )}
        {resendState.error && (
          <div className="mt-4 px-4 py-3 text-sm text-rose-700 bg-rose-50 rounded-xl border border-rose-200/60">
            {resendState.error}
          </div>
        )}

        <p className="text-xs text-neutral-400 mt-8">
          Didn&apos;t receive it? Check your spam folder, or{' '}
          <button
            type="button"
            onClick={() => {
              setPendingEmail(null)
              setError(null)
              setResendState({ loading: false, message: null, error: null })
            }}
            className="text-neutral-700 hover:text-neutral-900 underline underline-offset-2"
          >
            try a different email
          </button>
          .
        </p>
      </div>
    )
  }

  return (
    <div className="w-full">
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
          label="Mobile number"
          name="phone"
          type="tel"
          placeholder="+91 98XXXXXXXX"
          required
          autoComplete="tel"
          pattern="^\+?[\d\s\-()]{8,20}$"
          hint="We'll use this for exam updates."
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Date of birth"
            name="date_of_birth"
            type="date"
            required
            autoComplete="bday"
            max={maxDob || undefined}
          />
          <Input
            label="City"
            name="city"
            type="text"
            placeholder="Mumbai (optional)"
            autoComplete="address-level2"
          />
        </div>
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
