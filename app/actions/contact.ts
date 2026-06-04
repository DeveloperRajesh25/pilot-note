'use server';

import { createClient } from '@/lib/supabase/server';

export interface ContactResult {
  success?: boolean;
  error?: string;
}

export async function submitContact(formData: FormData): Promise<ContactResult> {
  const name    = (formData.get('name')    as string)?.trim();
  const email   = (formData.get('email')   as string)?.trim().toLowerCase();
  const topic   = (formData.get('topic')   as string)?.trim();
  const message = (formData.get('message') as string)?.trim();

  if (!name || !email || !topic || !message) {
    return { error: 'Please fill in all required fields.' };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: 'Please enter a valid email address.' };
  }
  if (message.length < 10) {
    return { error: 'Message is too short. Please give us some detail.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.from('contact_submissions').insert({
    name,
    email,
    topic,
    message,
  });

  if (error) {
    console.error('contact_submissions insert error:', error.message);
    return { error: 'Could not send your message. Please email us directly.' };
  }

  return { success: true };
}
