import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getExamUser } from '@/lib/exam-session';
import type { ViolationEvent, ViolationType } from '@/lib/types';

const VALID_TYPES: ViolationType[] = [
  'tab_hidden',
  'window_blur',
  'fullscreen_exit',
  'right_click',
  'devtools_key',
  'clipboard',
];

interface IncomingViolation {
  type: ViolationType;
  meta?: Record<string, unknown>;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ examId: string }> }
) {
  const { examId } = await params;
  const examUser = await getExamUser(examId);
  if (!examUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object' || !VALID_TYPES.includes(body.type)) {
    return NextResponse.json({ error: 'Invalid violation' }, { status: 400 });
  }
  const incoming = body as IncomingViolation;

  // Write through the admin (service-role) client so the proctoring log isn't
  // gated by RLS edge cases on jsonb columns. The user identity has already
  // been verified above via supabase.auth.getUser().
  const adminDb = createAdminClient();

  // Pull existing attempt + violations.
  let { data: attempt } = await adminDb
    .from('exam_attempts')
    .select('id, violations, submitted_at')
    .eq('user_id', examUser.user_id)
    .eq('exam_id', examId)
    .maybeSingle();

  // Lazily create an attempt row if the user hits a violation before the
  // shell GET has booted one (e.g. focus-loss the instant the page paints).
  // Only do this if they're actually registered for the exam.
  if (!attempt) {
    const { data: reg } = await adminDb
      .from('exam_registrations')
      .select('id')
      .eq('user_id', examUser.user_id)
      .eq('exam_id', examId)
      .maybeSingle();
    if (!reg) {
      // Not registered — don't manufacture an attempt row, but tell the client
      // so the silent failure is visible in the network panel.
      return NextResponse.json({ error: 'Not registered for this exam' }, { status: 403 });
    }
    const { data: created, error: createErr } = await adminDb
      .from('exam_attempts')
      .insert({ user_id: examUser.user_id, exam_id: examId, answers: {} })
      .select('id, violations, submitted_at')
      .single();
    if (createErr || !created) {
      return NextResponse.json({ error: createErr?.message ?? 'Could not record violation' }, { status: 500 });
    }
    attempt = created;
  }

  // If already submitted, still record the flag (it happened in the window,
  // and admins want late events like a tab-close on the results page). Submit
  // status is conveyed back so the client can decide what to do.
  const existing: ViolationEvent[] = Array.isArray(attempt.violations) ? attempt.violations : [];

  // Server-side dedupe: drop if the same type fired within the last 2 seconds.
  const nowMs = Date.now();
  const last = existing[existing.length - 1];
  if (last && last.type === incoming.type) {
    const lastMs = new Date(last.at).getTime();
    if (nowMs - lastMs < 2000) {
      return NextResponse.json({ ok: true, deduped: true });
    }
  }

  const event: ViolationEvent = {
    type: incoming.type,
    at: new Date(nowMs).toISOString(),
    ...(incoming.meta ? { meta: incoming.meta } : {}),
  };

  const { error } = await adminDb
    .from('exam_attempts')
    .update({ violations: [...existing, event] })
    .eq('id', attempt.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, submitted: !!attempt.submitted_at });
}
