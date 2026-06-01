import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// Public — list active chapters for a subject. Adds question_count and, for a
// logged-in user, isOwned (free chapters are always considered accessible).
export async function GET(request: NextRequest) {
  const subjectId = request.nextUrl.searchParams.get('subjectId');
  if (!subjectId) return NextResponse.json({ error: 'subjectId required' }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const db = createAdminClient();
  const [{ data: subject }, { data: chapters, error }] = await Promise.all([
    db
      .from('dgca_subjects')
      .select('id, name, slug, course_id, dgca_courses(id, name, slug)')
      .eq('id', subjectId)
      .maybeSingle(),
    db
      .from('dgca_chapters')
      .select('*')
      .eq('subject_id', subjectId)
      .eq('status', 'active')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true }),
  ]);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const list = chapters ?? [];
  const ids = list.map((c) => c.id);

  const qCounts: Record<string, number> = {};
  const owned = new Set<string>();
  if (ids.length > 0) {
    const { data: qs } = await db.from('dgca_questions').select('chapter_id').in('chapter_id', ids);
    for (const q of (qs ?? []) as { chapter_id: string }[]) {
      qCounts[q.chapter_id] = (qCounts[q.chapter_id] ?? 0) + 1;
    }
    if (user) {
      const { data: purchases } = await db
        .from('dgca_chapter_purchases')
        .select('chapter_id')
        .eq('user_id', user.id)
        .in('chapter_id', ids);
      for (const p of (purchases ?? []) as { chapter_id: string }[]) owned.add(p.chapter_id);
    }
  }

  return NextResponse.json({
    subject: subject ?? null,
    chapters: list.map((c) => ({
      ...c,
      question_count: qCounts[c.id] ?? 0,
      isOwned: c.price === 0 || owned.has(c.id),
    })),
  });
}
