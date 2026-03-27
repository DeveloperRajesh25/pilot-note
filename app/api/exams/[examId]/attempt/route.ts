import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET — start or resume an exam attempt, returns questions
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

  // Must be registered
  const { data: reg } = await supabase
    .from('exam_registrations')
    .select('id')
    .eq('user_id', user.id)
    .eq('exam_id', examId)
    .maybeSingle();

  if (!reg) {
    return NextResponse.json({ error: 'Not registered for this exam' }, { status: 403 });
  }

  // Get or create attempt
  let { data: attempt } = await supabase
    .from('exam_attempts')
    .select('*')
    .eq('user_id', user.id)
    .eq('exam_id', examId)
    .maybeSingle();

  if (!attempt) {
    const { data: newAttempt, error: createErr } = await supabase
      .from('exam_attempts')
      .insert({ user_id: user.id, exam_id: examId, answers: {} })
      .select()
      .single();
    if (createErr) return NextResponse.json({ error: createErr.message }, { status: 500 });
    attempt = newAttempt;
  }

  // If already submitted, return result only
  if (attempt.submitted_at) {
    return NextResponse.json({
      submitted: true,
      score: attempt.score,
      total: attempt.total,
      answers: attempt.answers,
    });
  }

  // Fetch questions (only for registered user — RLS enforced)
  const { data: questions, error: qErr } = await supabase
    .from('exam_questions')
    .select('id, question, options')
    .eq('exam_id', examId)
    .order('created_at');

  if (qErr) return NextResponse.json({ error: qErr.message }, { status: 500 });

  // Fetch exam metadata
  const { data: exam } = await supabase
    .from('exams')
    .select('title, subject, duration, total_questions')
    .eq('id', examId)
    .maybeSingle();

  return NextResponse.json({
    submitted: false,
    attempt,
    questions: questions ?? [],
    exam,
  });
}

// POST — submit answers and calculate score
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
  const { answers } = body; // { [questionId]: selectedIndex }

  if (!answers || typeof answers !== 'object') {
    return NextResponse.json({ error: 'answers required' }, { status: 400 });
  }

  // Check registration
  const { data: reg } = await supabase
    .from('exam_registrations')
    .select('id')
    .eq('user_id', user.id)
    .eq('exam_id', examId)
    .maybeSingle();

  if (!reg) {
    return NextResponse.json({ error: 'Not registered' }, { status: 403 });
  }

  // Prevent double submission
  const { data: existingAttempt } = await supabase
    .from('exam_attempts')
    .select('submitted_at, score, total')
    .eq('user_id', user.id)
    .eq('exam_id', examId)
    .maybeSingle();

  if (existingAttempt?.submitted_at) {
    return NextResponse.json({
      message: 'Already submitted',
      score: existingAttempt.score,
      total: existingAttempt.total,
    });
  }

  // Fetch correct answers
  const { data: questions, error: qErr } = await supabase
    .from('exam_questions')
    .select('id, correct')
    .eq('exam_id', examId);

  if (qErr) return NextResponse.json({ error: qErr.message }, { status: 500 });

  // Calculate score
  let score = 0;
  const total = (questions ?? []).length;
  (questions ?? []).forEach((q: { id: string; correct: number }) => {
    if (answers[q.id] === q.correct) score++;
  });

  // Save attempt
  const { data: savedAttempt, error: saveErr } = await supabase
    .from('exam_attempts')
    .upsert({
      user_id: user.id,
      exam_id: examId,
      answers,
      score,
      total,
      submitted_at: new Date().toISOString(),
    }, { onConflict: 'user_id,exam_id' })
    .select()
    .single();

  if (saveErr) return NextResponse.json({ error: saveErr.message }, { status: 500 });

  return NextResponse.json({ success: true, score, total, attempt: savedAttempt });
}
