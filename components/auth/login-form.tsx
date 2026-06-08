'use client'

import { useState } from 'react'
import { login } from '@/app/actions/auth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import Link from 'next/link'
import { Loader2, ArrowRight } from 'lucide-react'

export function LoginForm() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    const result = await login(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="w-full">
      <span className="text-[11px] uppercase tracking-[0.22em] text-neutral-500 font-medium flex items-center gap-2 mb-5">
        <span className="w-6 h-px bg-neutral-900" />
        Welcome back
      </span>
      <h1 className="font-display text-4xl sm:text-5xl md:text-6xl leading-[1] sm:leading-[0.95] tracking-[-0.03em] text-neutral-900 mb-3">
        Sign <span className="italic-serif">in.</span>
      </h1>
      <p className="text-neutral-500 mb-8 sm:mb-10 text-sm sm:text-[15px]">
One less thing to worry about on your path to the cockpit.      </p>

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
          placeholder="••••••••"
          required
          autoComplete="current-password"
        />

        {error && (
          <div className="px-4 py-3 text-sm text-rose-700 bg-rose-50 rounded-xl border border-rose-200/60">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between text-sm pt-1">
          <label className="flex items-center gap-2.5 cursor-pointer text-neutral-500">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-neutral-300 text-emerald-500 focus:ring-emerald-500"
            />
            <span>Remember me</span>
          </label>
          <Link
            href="/forgot-password"
            className="text-neutral-900 hover:text-emerald-600 font-medium transition-colors link-underline"
          >
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          variant="primary"
          className="w-full h-12 mt-3"
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              Sign in <ArrowRight className="w-4 h-4" />
            </>
          )}
        </Button>
      </form>

      <div className="mt-10 pt-8 border-t border-neutral-200 text-center text-sm">
        <p className="text-neutral-500">
          New to Pilot Note?{' '}
          <Link
            href="/signup"
            className="text-neutral-900 font-medium hover:text-emerald-600 transition-colors link-underline"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  )
}
