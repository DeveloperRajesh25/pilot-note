import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { opaqueId } from '@/lib/admin/ids';

interface BulkQuestionInput {
  question: unknown;
  options: unknown;
  correct: unknown;
  explanation?: unknown;
}

export async function POST(request: NextRequest) {
  const check = await requireAdmin();
  if (check.error) return check.error;

  const body = await request.json();
  const { test_id, questions } = body;

  if (!test_id) return NextResponse.json({ error: 'test_id required' }, { status: 400 });
  if (!Array.isArray(questions) || questions.length === 0) {
    return NextResponse.json({ error: 'questions array required' }, { status: 400 });
  }

  const rows: { id: string; test_id: string; question: string; options: string[]; correct: number; explanation: string | null }[] = [];
  const errors: string[] = [];

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i] as BulkQuestionInput;
    const num = i + 1;

    const trimmedQ = typeof q.question === 'string' ? q.question.trim() : '';
    if (!trimmedQ) { errors.push(`Row ${num}: question text is required`); continue; }

    if (!Array.isArray(q.options) || q.options.length < 2) {
      errors.push(`Row ${num}: at least 2 options required`); continue;
    }
    const trimmedOpts = (q.options as unknown[]).map((o) => (typeof o === 'string' ? o.trim() : ''));
    if (trimmedOpts.some((o) => !o)) {
      errors.push(`Row ${num}: all options must be filled`); continue;
    }

    const correct = typeof q.correct === 'number' ? q.correct : -1;
    if (correct < 0 || correct >= trimmedOpts.length) {
      errors.push(`Row ${num}: correct index out of range`); continue;
    }

    const explanation = typeof q.explanation === 'string' ? q.explanation.trim() : null;

    rows.push({
      id: opaqueId('rq1'),
      test_id,
      question: trimmedQ,
      options: trimmedOpts,
      correct,
      explanation: explanation || null,
    });
  }

  if (rows.length === 0) {
    return NextResponse.json({ error: errors.join('; ') }, { status: 400 });
  }

  const db = createAdminClient();
  const { data, error } = await db.from('rtr_questions_part1').insert(rows).select();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    inserted: data?.length ?? 0,
    errors: errors.length > 0 ? errors : undefined,
  }, { status: 201 });
}
