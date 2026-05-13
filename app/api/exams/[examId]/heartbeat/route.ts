import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface HeartbeatBody {
  answers?: Record<string, number>;
  current_question_index?: number;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ examId: string }> }
) {
  const { examId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: exam } = await supabase
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

  // Persist progress only when live and only for own row (RLS-protected).
  if (phase === 'live') {
    const update: Record<string, unknown> = { last_seen_at: new Date().toISOString() };
    if (body.answers && typeof body.answers === 'object') {
      update.answers = body.answers;
    }
    if (typeof body.current_question_index === 'number' && body.current_question_index >= 0) {
      update.current_question_index = body.current_question_index;
    }

    await supabase
      .from('exam_attempts')
      .update(update)
      .eq('user_id', user.id)
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
