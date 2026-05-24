import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getExamUser } from '@/lib/exam-session';

interface HeartbeatBody {
  answers?: Record<string, number>;
  current_question_index?: number;
  marked_for_review?: string[];
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

  const db = createAdminClient();
  const { data: exam } = await db
    .from('exams')
    .select('id, start_at, end_at')
    .eq('id', examId)
    .maybeSingle();

  if (!exam) {
    return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
  }

  const body: HeartbeatBody = await request.json().catch(() => ({}));

  const nowMs = Date.now();
  const startMs = exam.start_at ? new Date(exam.start_at).getTime() : null;
  const endMs = exam.end_at ? new Date(exam.end_at).getTime() : null;
  const phase: 'pre_exam' | 'live' | 'post_exam' =
    !startMs || nowMs < startMs ? 'pre_exam' :
    endMs && nowMs >= endMs ? 'post_exam' :
    'live';

  const remaining = endMs ? Math.max(0, Math.floor((endMs - nowMs) / 1000)) : 0;

  // Persist progress only when live.
  if (phase === 'live') {
    const update: Record<string, unknown> = { last_seen_at: new Date().toISOString() };
    if (body.answers && typeof body.answers === 'object') {
      update.answers = body.answers;
    }
    if (typeof body.current_question_index === 'number' && body.current_question_index >= 0) {
      update.current_question_index = body.current_question_index;
    }
    if (Array.isArray(body.marked_for_review)) {
      update.marked_for_review = body.marked_for_review.filter((s): s is string => typeof s === 'string');
    }

    await db
      .from('exam_attempts')
      .update(update)
      .eq('user_id', examUser.user_id)
      .eq('exam_id', examId)
      .is('submitted_at', null);
  }

  return NextResponse.json({
    server_now: nowMs,
    phase,
    remaining_seconds: remaining,
    start_at: exam.start_at,
    end_at: exam.end_at,
  });
}
