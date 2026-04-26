import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  const check = await requireAdmin();
  if (check.error) return check.error;
  const db = createAdminClient();
  const { data, error } = await db.from('rtr_tests').select('*').order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ tests: data ?? [] });
}

export async function POST(request: NextRequest) {
  const check = await requireAdmin();
  if (check.error) return check.error;
  const body = await request.json();
  const { id, title, description, price, status } = body;
  if (!title) return NextResponse.json({ error: 'title required' }, { status: 400 });
  const db = createAdminClient();
  const record: Record<string, unknown> = { title, description, price: price ?? 299, status: status ?? 'active' };
  if (id) record.id = id;
  const { data, error } = await db.from('rtr_tests').insert(record).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ test: data }, { status: 201 });
}
