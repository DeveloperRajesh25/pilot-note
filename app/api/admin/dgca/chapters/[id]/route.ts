import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { createAdminClient } from '@/lib/supabase/admin';

// GET single chapter with its questions + breadcrumb (subject + course).
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const check = await requireAdmin();
  if (check.error) return check.error;
  const { id } = await params;
  const db = createAdminClient();

  const { data: chapter, error } = await db
    .from('dgca_chapters')
    .select('*, dgca_subjects(id, name, course_id, dgca_courses(id, name))')
    .eq('id', id)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!chapter) return NextResponse.json({ chapter: null, questions: [] }, { status: 404 });

  const { data: questions } = await db
    .from('dgca_questions')
    .select('*')
    .eq('chapter_id', id)
    .order('created_at', { ascending: true });

  return NextResponse.json({ chapter, questions: questions ?? [] });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const check = await requireAdmin();
  if (check.error) return check.error;
  const { id } = await params;
  const body = await request.json();

  const patch: Record<string, unknown> = {};
  if (typeof body.title === 'string') patch.title = body.title.trim();
  if (body.description !== undefined) {
    patch.description = typeof body.description === 'string' ? body.description.trim() || null : null;
  }
  if (body.price !== undefined) patch.price = Math.max(0, Math.round(Number(body.price) || 0));
  if (typeof body.status === 'string') patch.status = body.status === 'inactive' ? 'inactive' : 'active';
  if (typeof body.subject_id === 'string') patch.subject_id = body.subject_id.trim();
  if (body.sort_order !== undefined) patch.sort_order = Number(body.sort_order) || 0;
  if (Object.keys(patch).length === 0) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });

  const db = createAdminClient();
  const { data, error } = await db.from('dgca_chapters').update(patch).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ chapter: data });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const check = await requireAdmin();
  if (check.error) return check.error;
  const { id } = await params;
  const db = createAdminClient();
  const { error } = await db.from('dgca_chapters').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
