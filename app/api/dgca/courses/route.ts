import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

// Public — list courses (CPL / ATPL) with how many subjects each has.
export async function GET() {
  const db = createAdminClient();
  const [{ data: courses, error }, { data: subjects }] = await Promise.all([
    db.from('dgca_courses').select('*').order('sort_order', { ascending: true }),
    db.from('dgca_subjects').select('course_id'),
  ]);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const counts: Record<string, number> = {};
  for (const s of (subjects ?? []) as { course_id: string }[]) {
    counts[s.course_id] = (counts[s.course_id] ?? 0) + 1;
  }
  return NextResponse.json({
    courses: (courses ?? []).map((c) => ({ ...c, subject_count: counts[c.id] ?? 0 })),
  });
}
