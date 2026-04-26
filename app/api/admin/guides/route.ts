import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  const check = await requireAdmin();
  if (check.error) return check.error;
  const db = createAdminClient();
  const { data, error } = await db.from('guides').select('*').order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ guides: data ?? [] });
}

export async function POST(request: NextRequest) {
  const check = await requireAdmin();
  if (check.error) return check.error;
  const body = await request.json();
  const { id, title, category, summary, content, read_time, difficulty, published } = body;
  if (!title || !category) return NextResponse.json({ error: 'title and category required' }, { status: 400 });
  const db = createAdminClient();
  const record: Record<string, unknown> = { title, category, summary, content, read_time, difficulty, published: published ?? true };
  if (id) record.id = id;
  const { data, error } = await db.from('guides').insert(record).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ guide: data }, { status: 201 });
}
