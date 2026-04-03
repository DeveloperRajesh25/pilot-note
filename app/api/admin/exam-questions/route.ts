import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  const check = await requireAdmin();
  if (check.error) return check.error;
  const { searchParams } = new URL(request.url);
  const examId = searchParams.get('examId');
  const db = createAdminClient();
  let query = db.from('exam_questions').select('*').order('created_at');
  if (examId) query = query.eq('exam_id', examId);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ questions: data ?? [] });
}

export async function POST(request: NextRequest) {
  const check = await requireAdmin();
  if (check.error) return check.error;
  const body = await request.json();
  const { exam_id, question, options, correct, explanation } = body;
  if (!exam_id || !question || !options || correct === undefined) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  const db = createAdminClient();
  const { data, error } = await db.from('exam_questions').insert({ exam_id, question, options, correct, explanation }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ question: data }, { status: 201 });
}
