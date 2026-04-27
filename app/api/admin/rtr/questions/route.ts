import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { opaqueId } from '@/lib/admin/ids';

// --- Part 1 Questions ---
export async function GET(request: NextRequest) {
  const check = await requireAdmin();
  if (check.error) return check.error;
  const { searchParams } = new URL(request.url);
  const testId = searchParams.get('testId');
  const db = createAdminClient();
  let query = db.from('rtr_questions_part1').select('*').order('id');
  if (testId) query = query.eq('test_id', testId);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ questions: data ?? [] });
}

export async function POST(request: NextRequest) {
  const check = await requireAdmin();
  if (check.error) return check.error;
  const body = await request.json();
  const { id, test_id, question, options, correct, explanation } = body;
  if (!test_id || !question || !options || correct === undefined) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  const db = createAdminClient();
  const record: Record<string, unknown> = { test_id, question, options, correct, explanation };
  record.id = id || opaqueId('rq1');
  const { data, error } = await db.from('rtr_questions_part1').insert(record).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ question: data }, { status: 201 });
}
