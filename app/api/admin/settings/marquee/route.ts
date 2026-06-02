import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  const check = await requireAdmin();
  if (check.error) return check.error;
  const db = createAdminClient();
  const { data, error } = await db
    .from('site_settings')
    .select('value')
    .eq('key', 'marquee_items')
    .single();
  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const items: string[] = Array.isArray(data?.value) ? data.value : [];
  return NextResponse.json({ items });
}

export async function PUT(request: NextRequest) {
  const check = await requireAdmin();
  if (check.error) return check.error;

  const body = await request.json();
  const items: unknown = body.items;
  if (!Array.isArray(items) || items.some((i) => typeof i !== 'string')) {
    return NextResponse.json({ error: 'items must be an array of strings' }, { status: 400 });
  }

  const db = createAdminClient();
  const { error } = await db.from('site_settings').upsert(
    { key: 'marquee_items', value: items, updated_at: new Date().toISOString() },
    { onConflict: 'key' }
  );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, items });
}
