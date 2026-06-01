import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  const check = await requireAdmin();
  if (check.error) return check.error;
  const db = createAdminClient();
  const { data, error } = await db
    .from('pariksha_toppers')
    .select('*')
    .order('rank', { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ toppers: data ?? [] });
}

export async function POST(request: NextRequest) {
  const check = await requireAdmin();
  if (check.error) return check.error;
  const body = await request.json();

  const student_name = typeof body.student_name === 'string' ? body.student_name.trim() : '';
  if (!student_name) return NextResponse.json({ error: 'student_name required' }, { status: 400 });

  const record = {
    rank: Number(body.rank) || 1,
    student_name,
    subject: typeof body.subject === 'string' ? body.subject.trim() || null : null,
    marks: body.marks === '' || body.marks == null ? null : Number(body.marks),
    total_marks: body.total_marks === '' || body.total_marks == null ? null : Number(body.total_marks),
    photo_url: typeof body.photo_url === 'string' ? body.photo_url.trim() || null : null,
    exam_label: typeof body.exam_label === 'string' ? body.exam_label.trim() || null : null,
    published: body.published === undefined ? true : !!body.published,
  };
  const db = createAdminClient();
  const { data, error } = await db.from('pariksha_toppers').insert(record).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ topper: data }, { status: 201 });
}
