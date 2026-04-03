import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  const check = await requireAdmin();
  if (check.error) return check.error;

  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const db = createAdminClient();

  let query = db.from('aptitude_questions').select('*').order('category').order('id');
  if (category && category !== 'all') query = query.eq('category', category);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ questions: data ?? [] });
}

export async function POST(request: NextRequest) {
  const check = await requireAdmin();
  if (check.error) return check.error;

  const body = await request.json();
  const { id, category, question, options, correct, explanation } = body;

  if (!category || !question || !options || correct === undefined) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const db = createAdminClient();
  const record: any = { category, question, options, correct, explanation };
  if (id) record.id = id;

  const { data, error } = await db.from('aptitude_questions').insert(record).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ question: data }, { status: 201 });
}
