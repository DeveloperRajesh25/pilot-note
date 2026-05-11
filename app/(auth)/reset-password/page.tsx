'use client'

import { useState } from 'react'
import { updatePassword } from '@/app/actions/auth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Loader2, KeyRound, ArrowRight } from 'lucide-react'

export default function ResetPasswordPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    const result = await updatePassword(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="w-full">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-neutral-900 text-white mb-7">
        <KeyRound className="w-6 h-6" strokeWidth={1.5} />
      </div>
      <span className="text-[11px] uppercase tracking-[0.22em] text-neutral-500 font-medium flex items-center gap-2 mb-5">
        <span className="w-6 h-px bg-neutral-900" />
        Set a new password
      </span>
      <h1 className="font-display text-5xl md:text-6xl leading-[0.95] tracking-[-0.03em] text-neutral-900 mb-3">
        New <span className="italic-serif">password.</span>
      </h1>
      <p className="text-neutral-500 mb-10 text-[15px]">
        Choose something memorable but secure.
      </p>

      <form action={handleSubmit} className="space-y-5">
        <Input
          label="New password"
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

        <Button type="submit" variant="primary" className="w-full h-12 mt-2" disabled={loading}>
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              Update password <ArrowRight className="w-4 h-4" />
            </>
          )}
        </Button>
      </form>
    </div>
  )
}
