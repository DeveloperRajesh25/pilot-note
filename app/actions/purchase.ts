'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function purchaseRTRTest(testId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Check test exists and is active
  const { data: test } = await supabase
    .from('rtr_tests')
    .select('id, price, status')
    .eq('id', testId)
    .eq('status', 'active')
    .maybeSingle()

  if (!test) return { error: 'Test not found or not available.' }

  // Check if already purchased
  const { data: existing } = await supabase
    .from('user_purchases')
    .select('id')
    .eq('user_id', user.id)
    .eq('test_id', testId)
    .maybeSingle()

  if (existing) return { message: 'Already purchased', alreadyOwned: true }

  // Simulated purchase — in production, verify Razorpay payment_id here
  const { error } = await supabase
    .from('user_purchases')
    .insert({
      user_id: user.id,
      test_id: testId,
      amount: test.price ?? 299,
      payment_id: 'simulated',
    })

  if (error) return { error: error.message }

  return { success: true }
}
