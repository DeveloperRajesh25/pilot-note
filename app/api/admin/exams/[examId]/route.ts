import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ examId: string }> }
) {
  const { examId } = await params;
  const check = await requireAdmin();
  if (check.error) return check.error;
  const db = createAdminClient();
  const [{ data: exam }, { data: questions }, { data: regs }, { data: attempts }] = await Promise.all([
    db.from('exams').select('*').eq('id', examId).maybeSingle(),
    db.from('exam_questions').select('*').eq('exam_id', examId).order('created_at'),
    db.from('exam_registrations').select('id, user_id, registered_at, profiles(email, full_name)').eq('exam_id', examId).order('registered_at', { ascending: false }),
    db.from('exam_attempts').select('user_id, score, total, submitted_at, profiles(email)').eq('exam_id', examId).not('submitted_at', 'is', null),
  ]);
  if (!exam) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ exam, questions: questions ?? [], registrations: regs ?? [], attempts: attempts ?? [] });
}

const EXAM_FIELDS = ['title', 'subject', 'description', 'exam_date', 'exam_time', 'duration', 'total_questions', 'fee', 'status'] as const;

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ examId: string }> }
) {
  const { examId } = await params;
  const check = await requireAdmin();
  if (check.error) return check.error;
  const body = await request.json();
  const update: Record<string, unknown> = {};
  for (const k of EXAM_FIELDS) if (k in body) update[k] = body[k];
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }
  const db = createAdminClient();
  const { data, error } = await db.from('exams').update(update).eq('id', examId).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ exam: data });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ examId: string }> }
) {
  const { examId } = await params;
  const check = await requireAdmin();
  if (check.error) return check.error;
  const db = createAdminClient();
  const { error } = await db.from('exams').delete().eq('id', examId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
