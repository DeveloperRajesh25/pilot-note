import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  const check = await requireAdmin();
  if (check.error) return check.error;
  const db = createAdminClient();
  const { data, error } = await db
    .from('user_purchases')
    .select('*, rtr_tests(title), profiles(email, full_name)')
    .order('purchased_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ purchases: data ?? [] });
}
