import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// Public practice content — gated by chapter price + purchase.
//   free chapter  → anyone (even logged-out) may practice
//   paid chapter  → must be logged in AND own the chapter
export async function GET(_request: NextRequest, { params }: { params: Promise<{ chapterId: string }> }) {
  const { chapterId } = await params;
  const db = createAdminClient();

  const { data: chapter } = await db
    .from('dgca_chapters')
    .select('id, title, price, status, subject_id, dgca_subjects(name, dgca_courses(name))')
    .eq('id', chapterId)
    .maybeSingle();

  if (!chapter || chapter.status !== 'active') {
    return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
  }

  if (chapter.price > 0) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Login required', locked: true }, { status: 401 });

    const { data: purchase } = await db
      .from('dgca_chapter_purchases')
      .select('id')
      .eq('user_id', user.id)
      .eq('chapter_id', chapterId)
      .maybeSingle();
    if (!purchase) return NextResponse.json({ error: 'Chapter locked', locked: true }, { status: 403 });
  }

  const { data: questions, error } = await db
    .from('dgca_questions')
    .select('id, chapter_id, question, options, correct, explanation, image_url')
    .eq('chapter_id', chapterId)
    .order('created_at', { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ chapter, questions: questions ?? [] });
}
