import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { opaqueId } from '@/lib/admin/ids';

export async function GET(request: NextRequest) {
  const check = await requireAdmin();
  if (check.error) return check.error;
  const chapterId = request.nextUrl.searchParams.get('chapterId');
  if (!chapterId) return NextResponse.json({ error: 'chapterId required' }, { status: 400 });
  const db = createAdminClient();
  const { data, error } = await db
    .from('dgca_questions')
    .select('*')
    .eq('chapter_id', chapterId)
    .order('created_at', { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ questions: data ?? [] });
}

export async function POST(request: NextRequest) {
  const check = await requireAdmin();
  if (check.error) return check.error;
  const body = await request.json();

  const chapter_id = typeof body.chapter_id === 'string' ? body.chapter_id.trim() : '';
  const question = typeof body.question === 'string' ? body.question.trim() : '';
  if (!chapter_id) return NextResponse.json({ error: 'chapter_id required' }, { status: 400 });
  if (!question) return NextResponse.json({ error: 'question required' }, { status: 400 });

  if (!Array.isArray(body.options) || body.options.length < 2) {
    return NextResponse.json({ error: 'at least 2 options required' }, { status: 400 });
  }
  const options = (body.options as unknown[]).map((o) => (typeof o === 'string' ? o.trim() : ''));
  if (options.some((o) => !o)) return NextResponse.json({ error: 'all options must be filled' }, { status: 400 });

  const correct = Number(body.correct);
  if (!Number.isInteger(correct) || correct < 0 || correct >= options.length) {
    return NextResponse.json({ error: 'correct index out of range' }, { status: 400 });
  }

  // marks: positive integer, defaults to 1 when omitted.
  const marks = body.marks === undefined || body.marks === null || body.marks === '' ? 1 : Number(body.marks);
  if (!Number.isInteger(marks) || marks < 1) {
    return NextResponse.json({ error: 'marks must be a positive whole number' }, { status: 400 });
  }

  const record = {
    id: opaqueId('dq'),
    chapter_id,
    question,
    options,
    correct,
    marks,
    explanation: typeof body.explanation === 'string' ? body.explanation.trim() || null : null,
    image_url: typeof body.image_url === 'string' ? body.image_url.trim() || null : null,
  };
  const db = createAdminClient();
  const { data, error } = await db.from('dgca_questions').insert(record).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ question: data }, { status: 201 });
}
