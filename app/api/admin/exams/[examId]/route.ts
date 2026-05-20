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

  // exam_registrations.user_id and exam_attempts.user_id reference auth.users(id), not
  // public.profiles(id), so PostgREST cannot auto-join profiles. Fetch each table
  // separately then merge profile data by user_id.
  const [{ data: exam }, { data: questions }, { data: regs }, { data: attempts }] = await Promise.all([
    db.from('exams').select('*').eq('id', examId).maybeSingle(),
    db.from('exam_questions').select('*').eq('exam_id', examId).order('created_at'),
    db.from('exam_registrations').select('id, user_id, registered_at, payment_id, dob, roll_no, credentials_sent_at').eq('exam_id', examId).order('registered_at', { ascending: false }),
    db.from('exam_attempts').select('user_id, score, total, submitted_at, auto_submitted, violations').eq('exam_id', examId).not('submitted_at', 'is', null),
  ]);

  if (!exam) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Collect all user_ids that need profile data.
  const userIds = [
    ...new Set([
      ...(regs ?? []).map((r) => r.user_id as string),
      ...(attempts ?? []).map((a) => a.user_id as string),
    ]),
  ];

  type ProfileRow = { id: string; email: string | null; full_name: string | null };
  const profileMap: Record<string, { email: string | null; full_name: string | null }> = {};
  if (userIds.length > 0) {
    const { data: profiles } = await db
      .from('profiles')
      .select('id, email, full_name')
      .in('id', userIds);
    if (profiles) {
      for (const p of profiles as ProfileRow[]) {
        profileMap[p.id] = { email: p.email, full_name: p.full_name };
      }
    }
  }

  const registrations = (regs ?? []).map((r) => ({
    ...r,
    profiles: profileMap[r.user_id as string] ?? null,
  }));

  const attemptsWithProfiles = (attempts ?? []).map((a) => ({
    ...a,
    profiles: profileMap[a.user_id as string] ? { email: (profileMap[a.user_id as string]).email } : null,
  }));

  return NextResponse.json({ exam, questions: questions ?? [], registrations, attempts: attemptsWithProfiles });
}

const EXAM_FIELDS = [
  'title', 'subject', 'description', 'exam_date', 'exam_time',
  'duration', 'total_questions', 'fee', 'status',
  'start_at', 'end_at', 'per_question_seconds', 'pass_score', 'payment_provider',
] as const;

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
