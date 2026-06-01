import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { slugify } from '@/lib/admin/ids';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const check = await requireAdmin();
  if (check.error) return check.error;
  const { id } = await params;
  const body = await request.json();

  const patch: Record<string, unknown> = {};
  if (typeof body.name === 'string') patch.name = body.name.trim();
  if (typeof body.slug === 'string') patch.slug = slugify(body.slug) || undefined;
  if (body.sort_order !== undefined) patch.sort_order = Number(body.sort_order) || 0;
  if (Object.keys(patch).length === 0) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });

  const db = createAdminClient();
  const { data, error } = await db.from('dgca_courses').update(patch).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ course: data });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const check = await requireAdmin();
  if (check.error) return check.error;
  const { id } = await params;
  const db = createAdminClient();
  // Cascades to subjects → chapters → questions via FK on delete cascade.
  const { error } = await db.from('dgca_courses').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
