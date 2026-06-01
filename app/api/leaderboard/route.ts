import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

// Public — published Pariksha toppers, ranked. Capped at the Top 10.
export async function GET() {
  const db = createAdminClient();
  const { data, error } = await db
    .from('pariksha_toppers')
    .select('id, rank, student_name, subject, marks, total_marks, photo_url, exam_label')
    .eq('published', true)
    .order('rank', { ascending: true })
    .limit(10);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ toppers: data ?? [] });
}
