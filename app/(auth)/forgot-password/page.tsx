'use client'

import { useState } from 'react'
import { forgotPassword } from '@/app/actions/auth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import Link from 'next/link'
import { Loader2, Mail, ArrowLeft } from 'lucide-react'

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
    <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl border border-neutral-100">
      <div className="mb-6">
        <Link 
          href="/login" 
          className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-accent transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Login
        </Link>
        <h1 className="text-3xl font-bold mb-2">Forgot Password?</h1>
        <p className="text-text-secondary">No worries, we'll send you reset instructions.</p>
      </div>

      {message ? (
        <div className="p-4 bg-accent-glow border border-accent/20 rounded-xl text-sm leading-relaxed mb-6">
          {message}
        </div>
      ) : (
        <form action={handleSubmit} className="space-y-4">
          <Input
            label="Email Address"
            name="email"
            type="email"
            placeholder="name@example.com"
            required
            autoComplete="email"
          />

          {error && (
            <div className="p-3 text-sm text-red-500 bg-red-50 rounded-lg border border-red-100">
              {error}
            </div>
          )}

          <Button 
            type="submit" 
            variant="primary" 
            className="w-full py-4 text-base mt-2"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              'Reset Password'
            )}
          </Button>
        </form>
      )}
    </div>
  )
}
