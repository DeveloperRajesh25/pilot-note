import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ testId: string }> }
) {
  const { testId } = await params;
  const check = await requireAdmin();
  if (check.error) return check.error;
  const db = createAdminClient();
  const [{ data: test }, { data: q1 }, { data: q2 }] = await Promise.all([
    db.from('rtr_tests').select('*').eq('id', testId).maybeSingle(),
    db.from('rtr_questions_part1').select('*').eq('test_id', testId).order('id'),
    db.from('rtr_scenarios_part2').select('*').eq('test_id', testId).order('id'),
  ]);
  if (!test) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ test, questions: q1 ?? [], scenarios: q2 ?? [] });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ testId: string }> }
) {
  const { testId } = await params;
  const check = await requireAdmin();
  if (check.error) return check.error;
  const body = await request.json();
  const db = createAdminClient();
  const { data, error } = await db.from('rtr_tests').update(body).eq('id', testId).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ test: data });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ testId: string }> }
) {
  const { testId } = await params;
  const check = await requireAdmin();
  if (check.error) return check.error;
  const db = createAdminClient();
  const { error } = await db.from('rtr_tests').delete().eq('id', testId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
