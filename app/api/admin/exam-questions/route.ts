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
  const { exam_id, question, options, correct, explanation, image_url } = body;
  if (!exam_id || correct === undefined) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  // Hard reject empty question text or blank options. Empty content makes the
  // exam unplayable and there's no legitimate reason to allow it.
  const trimmedQ = typeof question === 'string' ? question.trim() : '';
  if (!trimmedQ) {
    return NextResponse.json({ error: 'Question text is required' }, { status: 400 });
  }
  if (!Array.isArray(options) || options.length < 2) {
    return NextResponse.json({ error: 'At least two options are required' }, { status: 400 });
  }
  const trimmedOpts = options.map((o) => (typeof o === 'string' ? o.trim() : ''));
  if (trimmedOpts.some((o) => !o)) {
    return NextResponse.json({ error: 'All options must be filled' }, { status: 400 });
  }
  if (typeof correct !== 'number' || correct < 0 || correct >= trimmedOpts.length) {
    return NextResponse.json({ error: 'Correct answer index is out of range' }, { status: 400 });
  }
  const db = createAdminClient();
  const { data, error } = await db
    .from('exam_questions')
    .insert({ exam_id, question: trimmedQ, options: trimmedOpts, correct, explanation, image_url: image_url ?? null })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ question: data }, { status: 201 });
}
