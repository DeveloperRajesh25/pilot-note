'use client'

import { useState } from 'react'
import { forgotPassword } from '@/app/actions/auth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import Link from 'next/link'
import { Loader2, ArrowLeft, Mail, ArrowRight } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    setMessage(null)
    const result = await forgotPassword(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    } else if (result?.message) {
      setMessage(result.message)
      setLoading(false)
    }
  }

  return (
    <div className="w-full">
      <Link
        href="/login"
        className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-900 transition-colors mb-10"
      >
        <ArrowLeft className="w-4 h-4" /> Back to sign in
      </Link>

      <span className="text-[11px] uppercase tracking-[0.22em] text-neutral-500 font-medium flex items-center gap-2 mb-5">
        <span className="w-6 h-px bg-neutral-900" />
        Account recovery
      </span>
      <h1 className="font-display text-5xl md:text-6xl leading-[0.95] tracking-[-0.03em] text-neutral-900 mb-3">
        Forgot <span className="italic-serif">password?</span>
      </h1>
      <p className="text-neutral-500 mb-10 text-[15px]">
        No worries — we&apos;ll send reset instructions to your inbox.
      </p>

      {message ? (
        <div className="px-5 py-4 bg-emerald-50 border border-emerald-200/60 rounded-2xl text-sm text-emerald-800 leading-relaxed flex items-start gap-3">
          <Mail className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <span>{message}</span>
        </div>
      ) : (
        <form action={handleSubmit} className="space-y-5">
          <Input
            label="Email"
            name="email"
            type="email"
            placeholder="you@example.com"
            required
            autoComplete="email"
          />

          {error && (
            <div className="px-4 py-3 text-sm text-rose-700 bg-rose-50 rounded-xl border border-rose-200/60">
              {error}
            </div>
          )}

          <Button type="submit" variant="primary" className="w-full h-12 mt-2" disabled={loading}>
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Send reset link <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </form>
      )}
    </div>
  )
}
