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
  const phoneRaw = (formData.get('phone') as string)?.trim() || ''
  const dobRaw = (formData.get('date_of_birth') as string)?.trim() || ''
  const city = (formData.get('city') as string)?.trim() || null

  if (!email || !password) {
    return { error: 'Email and password are required.' }
  }

  // Mobile is mandatory. We serve Indian pilots, so validate a 10-digit Indian
  // mobile number (must start 6–9). Accept an optional +91/91 country code or a
  // leading 0; strip any spaces, dashes or parens the user typed.
  const phoneDigits = phoneRaw.replace(/[^\d]/g, '')
  let phoneCore = phoneDigits
  if (phoneCore.length === 12 && phoneCore.startsWith('91')) phoneCore = phoneCore.slice(2)
  else if (phoneCore.length === 11 && phoneCore.startsWith('0')) phoneCore = phoneCore.slice(1)
  if (!phoneRaw || !/^[6-9]\d{9}$/.test(phoneCore)) {
    return { error: 'Please enter a valid 10-digit Indian mobile number.' }
  }
  // Store in a normalised, consistent format.
  const phone = `+91${phoneCore}`

  // DOB is mandatory. Expect YYYY-MM-DD from <input type="date">.
  if (!dobRaw || !/^\d{4}-\d{2}-\d{2}$/.test(dobRaw)) {
    return { error: 'Please enter your date of birth.' }
  }
  const dob = new Date(`${dobRaw}T00:00:00Z`)
  if (Number.isNaN(dob.getTime()) || dob.getTime() > Date.now()) {
    return { error: 'Please enter a valid date of birth.' }
  }
  const today = new Date()
  const age =
    today.getUTCFullYear() -
    dob.getUTCFullYear() -
    (today.getUTCMonth() < dob.getUTCMonth() ||
    (today.getUTCMonth() === dob.getUTCMonth() && today.getUTCDate() < dob.getUTCDate())
      ? 1
      : 0)
  if (age < 16) {
    return { error: 'You must be at least 16 years old to register.' }
  }

  const metadata: Record<string, string> = {
    phone,
    date_of_birth: dobRaw,
  }
  if (full_name) metadata.full_name = full_name
  if (city) metadata.city = city

  const origin = (await headers()).get('origin')
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=/`,
      data: metadata,
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
