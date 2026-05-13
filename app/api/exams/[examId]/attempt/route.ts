import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { ExamPhase } from '@/lib/types';

interface ExamRow {
  id: string;
  title: string;
  subject: string;
  duration: number;
  total_questions: number;
  start_at: string | null;
  end_at: string | null;
  per_question_seconds: number;
  pass_score: number;
}

interface QuestionRow {
  id: string;
  question: string;
  options: string[];
}

interface ScoringQuestion {
  id: string;
  correct: number;
}

function phaseFor(exam: ExamRow, nowMs: number): ExamPhase {
  const startMs = exam.start_at ? new Date(exam.start_at).getTime() : null;
  const endMs = exam.end_at ? new Date(exam.end_at).getTime() : null;
  if (!startMs || nowMs < startMs) return 'pre_exam';
  if (endMs && nowMs >= endMs) return 'post_exam';
  return 'live';
}

async function scoreAnswers(
  examId: string,
  answers: Record<string, number>
): Promise<{ score: number; total: number }> {
  const db = createAdminClient();
  const { data } = await db
    .from('exam_questions')
    .select('id, correct')
    .eq('exam_id', examId);
  const questions = (data ?? []) as ScoringQuestion[];
  const total = questions.length;
  let score = 0;
  for (const q of questions) {
    if (answers[q.id] === q.correct) score++;
  }
  return { score, total };
}

// GET — return phase + (when live) questions, server clock, and resume state.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ examId: string }> }
) {
  const { examId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: examData } = await supabase
    .from('exams')
    .select('id, title, subject, duration, total_questions, start_at, end_at, per_question_seconds, pass_score')
    .eq('id', examId)
    .maybeSingle();

  if (!examData) {
    return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
  }
  const exam = examData as ExamRow;

  const { data: reg } = await supabase
    .from('exam_registrations')
    .select('id')
    .eq('user_id', user.id)
    .eq('exam_id', examId)
    .maybeSingle();

  if (!reg) {
    return NextResponse.json({ error: 'Not registered for this exam' }, { status: 403 });
  }

  const nowMs = Date.now();
  const phase = phaseFor(exam, nowMs);

  // Always ensure an attempt row exists from the moment of registration; that way
  // proctoring + heartbeat can write to it as soon as the exam opens.
  let { data: attempt } = await supabase
    .from('exam_attempts')
    .select('*')
    .eq('user_id', user.id)
    .eq('exam_id', examId)
    .maybeSingle();

  if (!attempt) {
    const { data: created } = await supabase
      .from('exam_attempts')
      .insert({ user_id: user.id, exam_id: examId, answers: {} })
      .select('*')
      .single();
    attempt = created;
  }

  // Server-side auto-submit if the exam window closed and the attempt is still open.
  if (phase === 'post_exam' && attempt && !attempt.submitted_at) {
    const answers = (attempt.answers ?? {}) as Record<string, number>;
    const { score, total } = await scoreAnswers(examId, answers);
    const adminDb = createAdminClient();
    const { data: updated } = await adminDb
      .from('exam_attempts')
      .update({
        score,
        total,
        submitted_at: new Date().toISOString(),
        auto_submitted: true,
      })
      .eq('id', attempt.id)
      .select('*')
      .single();
    attempt = updated ?? attempt;
  }

  // Already-submitted (manual or auto). Return result envelope.
  if (attempt?.submitted_at) {
    return NextResponse.json({
      phase: 'post_exam',
      submitted: true,
      score: attempt.score,
      total: attempt.total,
      auto_submitted: attempt.auto_submitted,
      answers: attempt.answers,
      server_now: nowMs,
      start_at: exam.start_at,
      end_at: exam.end_at,
      exam: {
        title: exam.title,
        subject: exam.subject,
        pass_score: exam.pass_score,
      },
    });
  }

  // Pre-exam: don't return questions yet.
  if (phase === 'pre_exam') {
    return NextResponse.json({
      phase,
      submitted: false,
      server_now: nowMs,
      start_at: exam.start_at,
      end_at: exam.end_at,
      per_question_seconds: exam.per_question_seconds,
      exam: {
        title: exam.title,
        subject: exam.subject,
        duration: exam.duration,
        total_questions: exam.total_questions,
        pass_score: exam.pass_score,
      },
    });
  }

  // Live phase: load questions (RLS allows registered users).
  const { data: questions, error: qErr } = await supabase
    .from('exam_questions')
    .select('id, question, options')
    .eq('exam_id', examId)
    .order('created_at');

  if (qErr) {
    return NextResponse.json({ error: qErr.message }, { status: 500 });
  }

  const endMs = exam.end_at ? new Date(exam.end_at).getTime() : nowMs + exam.duration * 60_000;
  const remaining = Math.max(0, Math.floor((endMs - nowMs) / 1000));

  return NextResponse.json({
    phase,
    submitted: false,
    server_now: nowMs,
    start_at: exam.start_at,
    end_at: exam.end_at,
    remaining_seconds: remaining,
    per_question_seconds: exam.per_question_seconds,
    attempt: {
      id: attempt?.id,
      answers: attempt?.answers ?? {},
      current_question_index: attempt?.current_question_index ?? 0,
    },
    questions: (questions ?? []) as QuestionRow[],
    exam: {
      title: exam.title,
      subject: exam.subject,
      duration: exam.duration,
      total_questions: exam.total_questions,
      pass_score: exam.pass_score,
    },
  });
}

// POST — manual submit during live window.
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

  const body = await request.json();
  const { answers } = body ?? {};
  if (!answers || typeof answers !== 'object') {
    return NextResponse.json({ error: 'answers required' }, { status: 400 });
  }

  const { data: examData } = await supabase
    .from('exams')
    .select('id, start_at, end_at, per_question_seconds, pass_score')
    .eq('id', examId)
    .maybeSingle();
  if (!examData) {
    return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
  }

  const { data: reg } = await supabase
    .from('exam_registrations')
    .select('id')
    .eq('user_id', user.id)
    .eq('exam_id', examId)
    .maybeSingle();
  if (!reg) {
    return NextResponse.json({ error: 'Not registered' }, { status: 403 });
  }

  const nowMs = Date.now();
  const endMs = examData.end_at ? new Date(examData.end_at).getTime() : null;
  // 5-second grace for clock skew.
  if (endMs && nowMs > endMs + 5_000) {
    return NextResponse.json({ error: 'Exam window has closed' }, { status: 410 });
  }

  // Prevent double submission.
  const { data: existing } = await supabase
    .from('exam_attempts')
    .select('submitted_at, score, total, auto_submitted')
    .eq('user_id', user.id)
    .eq('exam_id', examId)
    .maybeSingle();

  if (existing?.submitted_at) {
    return NextResponse.json({
      message: 'Already submitted',
      score: existing.score,
      total: existing.total,
      auto_submitted: existing.auto_submitted,
    });
  }

  const { score, total } = await scoreAnswers(examId, answers as Record<string, number>);

  const { data: savedAttempt, error: saveErr } = await supabase
    .from('exam_attempts')
    .upsert(
      {
        user_id: user.id,
        exam_id: examId,
        answers,
        score,
        total,
        submitted_at: new Date().toISOString(),
        auto_submitted: false,
      },
      { onConflict: 'user_id,exam_id' }
    )
    .select()
    .single();

  if (saveErr) {
    return NextResponse.json({ error: saveErr.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, score, total, attempt: savedAttempt });
}
