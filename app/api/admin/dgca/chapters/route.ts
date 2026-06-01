import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { slugId } from '@/lib/admin/ids';

export async function GET(request: NextRequest) {
  const check = await requireAdmin();
  if (check.error) return check.error;
  const subjectId = request.nextUrl.searchParams.get('subjectId');
  const db = createAdminClient();
  let query = db
    .from('dgca_chapters')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });
  if (subjectId) query = query.eq('subject_id', subjectId);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Attach question counts so the admin tree shows how full each chapter is.
  const chapters = data ?? [];
  const ids = chapters.map((c) => c.id);
  const counts: Record<string, number> = {};
  if (ids.length > 0) {
    const { data: qs } = await db.from('dgca_questions').select('chapter_id').in('chapter_id', ids);
    for (const q of (qs ?? []) as { chapter_id: string }[]) {
      counts[q.chapter_id] = (counts[q.chapter_id] ?? 0) + 1;
    }
  }
  return NextResponse.json({
    chapters: chapters.map((c) => ({ ...c, question_count: counts[c.id] ?? 0 })),
  });
}

export async function POST(request: NextRequest) {
  const check = await requireAdmin();
  if (check.error) return check.error;
  const body = await request.json();
  const subject_id = typeof body.subject_id === 'string' ? body.subject_id.trim() : '';
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  if (!subject_id) return NextResponse.json({ error: 'subject_id required' }, { status: 400 });
  if (!title) return NextResponse.json({ error: 'title required' }, { status: 400 });

  const price = Math.max(0, Math.round(Number(body.price) || 0));
  const record = {
    id: body.id || slugId(title),
    subject_id,
    title,
    description: typeof body.description === 'string' ? body.description.trim() || null : null,
    price,
    status: body.status === 'inactive' ? 'inactive' : 'active',
    sort_order: Number(body.sort_order) || 0,
  };
  const db = createAdminClient();
  const { data, error } = await db.from('dgca_chapters').insert(record).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ chapter: data }, { status: 201 });
}
