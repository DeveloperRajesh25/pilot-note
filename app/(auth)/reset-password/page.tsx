'use client'

import { useState } from 'react'
import { updatePassword } from '@/app/actions/auth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Loader2, KeyRound } from 'lucide-react'

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
    <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl border border-neutral-100">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center">
            <KeyRound className="w-6 h-6 text-accent" />
          </div>
        </div>
        <h1 className="text-3xl font-bold mb-2">New Password</h1>
        <p className="text-text-secondary">Please enter your new password below.</p>
      </div>

      <form action={handleSubmit} className="space-y-4">
        <Input
          label="New Password"
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

        <Button 
          type="submit" 
          variant="primary" 
          className="w-full py-4 text-base mt-2"
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            'Update Password'
          )}
        </Button>
      </form>
    </div>
  )
}
