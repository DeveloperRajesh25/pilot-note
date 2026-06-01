import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { slugId, slugify } from '@/lib/admin/ids';

export async function GET() {
  const check = await requireAdmin();
  if (check.error) return check.error;
  const db = createAdminClient();
  const { data, error } = await db
    .from('dgca_courses')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ courses: data ?? [] });
}

export async function POST(request: NextRequest) {
  const check = await requireAdmin();
  if (check.error) return check.error;
  const body = await request.json();
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 });

  const slug = slugify((typeof body.slug === 'string' && body.slug.trim()) || name) || 'course';
  const record = {
    id: body.id || slugId(name),
    name,
    slug,
    sort_order: Number(body.sort_order) || 0,
  };
  const db = createAdminClient();
  const { data, error } = await db.from('dgca_courses').insert(record).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ course: data }, { status: 201 });
}
