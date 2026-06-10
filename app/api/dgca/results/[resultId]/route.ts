import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// Returns a saved DGCA practice result alongside the chapter's questions
// (with correct answers + explanations) so the candidate can review it later
// from their profile — the same detailed review they saw on submission.
export async function GET(_request: NextRequest, { params }: { params: Promise<{ resultId: string }> }) {
  const { resultId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Login required' }, { status: 401 });

  // RLS ensures the row is only returned when it belongs to the requesting user.
  const { data: result } = await supabase
    .from('dgca_practice_results')
    .select('id, chapter_id, score, total, answers, completed_at')
    .eq('id', resultId)
    .maybeSingle();

  if (!result) return NextResponse.json({ error: 'Result not found' }, { status: 404 });

  // Questions hold correct/explanation, so fetch them with the admin client.
  const db = createAdminClient();

  const { data: chapter } = await db
    .from('dgca_chapters')
    .select('id, title, dgca_subjects(name)')
    .eq('id', result.chapter_id)
    .maybeSingle();

  const { data: questions } = await db
    .from('dgca_questions')
    .select('id, question, options, correct, marks, explanation, image_url')
    .eq('chapter_id', result.chapter_id)
    .order('created_at', { ascending: true });

  return NextResponse.json({
    result,
    chapter: chapter ?? { id: result.chapter_id, title: 'DGCA practice', dgca_subjects: null },
    questions: questions ?? [],
  });
}
