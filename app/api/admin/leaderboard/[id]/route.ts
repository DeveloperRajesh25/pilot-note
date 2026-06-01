import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const check = await requireAdmin();
  if (check.error) return check.error;
  const { id } = await params;
  const body = await request.json();

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.rank !== undefined) patch.rank = Number(body.rank) || 1;
  if (typeof body.student_name === 'string') patch.student_name = body.student_name.trim();
  if (body.subject !== undefined) patch.subject = typeof body.subject === 'string' ? body.subject.trim() || null : null;
  if (body.marks !== undefined) patch.marks = body.marks === '' || body.marks == null ? null : Number(body.marks);
  if (body.total_marks !== undefined) patch.total_marks = body.total_marks === '' || body.total_marks == null ? null : Number(body.total_marks);
  if (body.photo_url !== undefined) patch.photo_url = typeof body.photo_url === 'string' ? body.photo_url.trim() || null : null;
  if (body.exam_label !== undefined) patch.exam_label = typeof body.exam_label === 'string' ? body.exam_label.trim() || null : null;
  if (body.published !== undefined) patch.published = !!body.published;

  const db = createAdminClient();
  const { data, error } = await db.from('pariksha_toppers').update(patch).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ topper: data });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const check = await requireAdmin();
  if (check.error) return check.error;
  const { id } = await params;
  const db = createAdminClient();
  const { error } = await db.from('pariksha_toppers').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
