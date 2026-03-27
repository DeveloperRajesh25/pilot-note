'use client'

import { useState } from 'react'
import { signup } from '@/app/actions/auth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import Link from 'next/link'
import { Loader2, CheckCircle2 } from 'lucide-react'

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
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl border border-neutral-100 text-center">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-accent-glow rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-accent" />
          </div>
        </div>
        <h1 className="text-2xl font-bold mb-4">Check your email</h1>
        <p className="text-text-secondary leading-relaxed mb-8">
          {message}
        </p>
        <Button href="/login" variant="secondary" className="w-full">
          Back to Login
        </Button>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl border border-neutral-100">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Create Account</h1>
        <p className="text-text-secondary">Start managing your pilot notes today</p>
      </div>

      <form action={handleSubmit} className="space-y-4">
        <Input
          label="Email Address"
          name="email"
          type="email"
          placeholder="name@example.com"
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
          <div className="p-3 text-sm text-red-500 bg-red-50 rounded-lg border border-red-100">
            {error}
          </div>
        )}

        <p className="text-xs text-text-light text-center px-4">
          By signing up, you agree to our{' '}
          <Link href="/terms" className="underline hover:text-text-secondary">Terms</Link> and{' '}
          <Link href="/privacy" className="underline hover:text-text-secondary">Privacy Policy</Link>
        </p>

        <Button 
          type="submit" 
          variant="primary" 
          className="w-full py-4 text-base mt-2"
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            'Create Account'
          )}
        </Button>
      </form>

      <div className="mt-8 text-center text-sm">
        <p className="text-text-secondary">
          Already have an account?{' '}
          <Link 
            href="/login" 
            className="text-accent hover:text-accent-dark font-bold transition-colors"
          >
            Sign In
          </Link>
        </p>
      </div>
    </div>
  )
}
