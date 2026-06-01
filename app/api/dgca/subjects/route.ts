import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

// Public — list subjects for a course, with active-chapter counts.
export async function GET(request: NextRequest) {
  const courseId = request.nextUrl.searchParams.get('courseId');
  if (!courseId) return NextResponse.json({ error: 'courseId required' }, { status: 400 });

  const db = createAdminClient();
  const [{ data: course }, { data: subjects, error }] = await Promise.all([
    db.from('dgca_courses').select('id, name, slug').eq('id', courseId).maybeSingle(),
    db.from('dgca_subjects').select('*').eq('course_id', courseId).order('sort_order', { ascending: true }),
  ]);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const subjectIds = (subjects ?? []).map((s) => s.id);
  const counts: Record<string, number> = {};
  if (subjectIds.length > 0) {
    const { data: chapters } = await db
      .from('dgca_chapters')
      .select('subject_id')
      .in('subject_id', subjectIds)
      .eq('status', 'active');
    for (const c of (chapters ?? []) as { subject_id: string }[]) {
      counts[c.subject_id] = (counts[c.subject_id] ?? 0) + 1;
    }
  }

  return NextResponse.json({
    course: course ?? null,
    subjects: (subjects ?? []).map((s) => ({ ...s, chapter_count: counts[s.id] ?? 0 })),
  });
}
