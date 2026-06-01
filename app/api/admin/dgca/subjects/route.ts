import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { slugId, slugify } from '@/lib/admin/ids';

export async function GET(request: NextRequest) {
  const check = await requireAdmin();
  if (check.error) return check.error;
  const courseId = request.nextUrl.searchParams.get('courseId');
  const db = createAdminClient();
  let query = db
    .from('dgca_subjects')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });
  if (courseId) query = query.eq('course_id', courseId);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ subjects: data ?? [] });
}

export async function POST(request: NextRequest) {
  const check = await requireAdmin();
  if (check.error) return check.error;
  const body = await request.json();
  const course_id = typeof body.course_id === 'string' ? body.course_id.trim() : '';
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (!course_id) return NextResponse.json({ error: 'course_id required' }, { status: 400 });
  if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 });

  const slug = slugify((typeof body.slug === 'string' && body.slug.trim()) || name) || 'subject';
  const record = {
    id: body.id || slugId(`${course_id}-${name}`),
    course_id,
    name,
    slug,
    sort_order: Number(body.sort_order) || 0,
  };
  const db = createAdminClient();
  const { data, error } = await db.from('dgca_subjects').insert(record).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ subject: data }, { status: 201 });
}
