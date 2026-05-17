import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { createAdminClient } from '@/lib/supabase/admin';

const EXAM_QUESTION_FIELDS = ['exam_id', 'question', 'options', 'correct', 'explanation', 'image_url'] as const;

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const check = await requireAdmin();
  if (check.error) return check.error;
  const body = await request.json();
  const update: Record<string, unknown> = {};
  for (const k of EXAM_QUESTION_FIELDS) if (k in body) update[k] = body[k];
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }
  if ('question' in update) {
    const q = typeof update.question === 'string' ? update.question.trim() : '';
    if (!q) return NextResponse.json({ error: 'Question text is required' }, { status: 400 });
    update.question = q;
  }
  if ('options' in update) {
    if (!Array.isArray(update.options) || update.options.length < 2) {
      return NextResponse.json({ error: 'At least two options are required' }, { status: 400 });
    }
    const trimmed = (update.options as unknown[]).map((o) => (typeof o === 'string' ? o.trim() : ''));
    if (trimmed.some((o) => !o)) {
      return NextResponse.json({ error: 'All options must be filled' }, { status: 400 });
    }
    update.options = trimmed;
  }
  if ('correct' in update) {
    const c = update.correct;
    const optsLen = Array.isArray(update.options) ? (update.options as unknown[]).length : Infinity;
    if (typeof c !== 'number' || c < 0 || c >= optsLen) {
      return NextResponse.json({ error: 'Correct answer index is out of range' }, { status: 400 });
    }
  }
  const db = createAdminClient();
  const { data, error } = await db.from('exam_questions').update(update).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ question: data });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const check = await requireAdmin();
  if (check.error) return check.error;
  const db = createAdminClient();
  const { error } = await db.from('exam_questions').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
