'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

export async function login(formData: FormData) {
  const email = (formData.get('email') as string)?.trim().toLowerCase()
  const password = formData.get('password') as string
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    // Supabase returns code `email_not_confirmed` (and message "Email not confirmed")
    // when the user hasn't clicked the confirmation link yet. Surface a clearer
    // message so the user knows to check their inbox instead of retrying blindly.
    if (error.code === 'email_not_confirmed' || /not confirmed/i.test(error.message)) {
      return {
        error:
          'Please confirm your email before signing in. We sent you a confirmation link — check your inbox (and spam folder).',
      }
    }
    return { error: error.message }
  }

  redirect('/')
}

export async function signup(formData: FormData) {
  const email = (formData.get('email') as string)?.trim().toLowerCase()
  const password = formData.get('password') as string
  const full_name = (formData.get('full_name') as string)?.trim() || null

  if (!email || !password) {
    return { error: 'Email and password are required.' }
  }

  const origin = (await headers()).get('origin')
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=/`,
      data: full_name ? { full_name } : undefined,
    },
  })

  if (error) {
    if (/already|registered/i.test(error.message)) {
      return { error: 'An account with this email already exists. Please sign in.' }
    }
    return { error: error.message }
  }

  // If a user already exists but is unconfirmed, Supabase returns a user object
  // with an empty `identities` array instead of an error. Treat that as duplicate
  // so we don't leak account existence silently.
  if (data.user && data.user.identities && data.user.identities.length === 0) {
    return { error: 'An account with this email already exists. Please sign in.' }
  }

  return {
    success: true,
    message: `We sent a confirmation link to ${email}. Click it to activate your account, then sign in.`,
  }
}

export async function resendConfirmation(formData: FormData) {
  const email = (formData.get('email') as string)?.trim().toLowerCase()
  if (!email) return { error: 'Email is required.' }

  const origin = (await headers()).get('origin')
  const supabase = await createClient()

  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: { emailRedirectTo: `${origin}/auth/callback?next=/` },
  })

  if (error) return { error: error.message }
  return { message: `Confirmation link resent to ${email}.` }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function forgotPassword(formData: FormData) {
  const origin = (await headers()).get('origin')
  const email = formData.get('email') as string
  const supabase = await createClient()

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/reset-password`,
  })

  if (error) {
    return { error: error.message }
  }

  return { message: 'Check your email for a password reset link.' }
}

export async function updatePassword(formData: FormData) {
  const password = formData.get('password') as string
  const supabase = await createClient()

  const { error } = await supabase.auth.updateUser({
    password: password,
  })

  if (error) {
    return { error: error.message }
  }

  redirect('/login?message=Password updated successfully')
}
