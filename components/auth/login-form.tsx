'use client'

import { useState } from 'react'
import { login } from '@/app/actions/auth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'

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
    <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl border border-neutral-100">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
        <p className="text-text-secondary">Sign in to your PilotNote account</p>
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
          placeholder="••••••••"
          required
          autoComplete="current-password"
        />

        {error && (
          <div className="p-3 text-sm text-red-500 bg-red-50 rounded-lg border border-red-100">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="rounded border-neutral-300 text-accent focus:ring-accent" />
            <span className="text-text-secondary">Remember me</span>
          </label>
          <Link
            href="/forgot-password"
            className="text-accent hover:text-accent-dark font-medium transition-colors"
          >
            Forgot password?
          </Link>
        </div>

        <Button 
          type="submit" 
          variant="primary" 
          className="w-full py-4 text-base mt-2"
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            'Sign In'
          )}
        </Button>
      </form>

      <div className="mt-8 text-center text-sm">
        <p className="text-text-secondary">
          Don&apos;t have an account?{' '}
          <Link 
            href="/signup" 
            className="text-accent hover:text-accent-dark font-bold transition-colors"
          >
            Create one for free
          </Link>
        </p>
      </div>
    </div>
  )
}
