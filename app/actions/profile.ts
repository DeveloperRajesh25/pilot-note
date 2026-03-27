'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function updateProfile(formData: FormData) {
  const full_name = formData.get('full_name') as string
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { error } = await supabase
    .from('profiles')
    .upsert({ id: user.id, email: user.email, full_name }, { onConflict: 'id' })

  if (error) {
    return { error: error.message }
  }

  return { message: 'Profile updated successfully.' }
}
