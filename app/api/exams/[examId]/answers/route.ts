import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getExamUser } from '@/lib/exam-session';

// Returns the candidate's answers alongside the correct answer + explanation
// for every question, plus their rank. Gated behind exam.results_released_at.
export async function GET(
  _request: NextRequest,
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
    .select('id, title, subject, pass_score, results_released_at')
    .eq('id', examId)
    .maybeSingle();
  if (!exam) return NextResponse.json({ error: 'Exam not found' }, { status: 404 });

  if (!exam.results_released_at) {
    return NextResponse.json(
      { error: 'Results have not been released yet. Check back after the announcement.' },
      { status: 423 }
    );
  }

  const { data: attempt } = await db
    .from('exam_attempts')
    .select('id, score, total, answers, submitted_at, auto_submitted, rank')
    .eq('user_id', examUser.user_id)
    .eq('exam_id', examId)
    .maybeSingle();
  if (!attempt?.submitted_at) {
    return NextResponse.json({ error: 'You did not submit this exam.' }, { status: 404 });
  }

  const { data: questions } = await db
    .from('exam_questions')
    .select('id, question, options, correct, explanation, image_url')
    .eq('exam_id', examId)
    .order('created_at');

  const { data: reg } = await db
    .from('exam_registrations')
    .select('roll_no')
    .eq('user_id', examUser.user_id)
    .eq('exam_id', examId)
    .maybeSingle();

  // Total candidates for rank context.
  const { count: totalCandidates } = await db
    .from('exam_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('exam_id', examId)
    .not('submitted_at', 'is', null);

  return NextResponse.json({
    exam: {
      id: exam.id,
      title: exam.title,
      subject: exam.subject,
      pass_score: exam.pass_score,
    },
    attempt: {
      score: attempt.score,
      total: attempt.total,
      rank: attempt.rank,
      auto_submitted: attempt.auto_submitted,
      total_candidates: totalCandidates ?? 0,
      roll_no: reg?.roll_no ?? null,
    },
    answers: attempt.answers ?? {},
    questions: questions ?? [],
  });
}
