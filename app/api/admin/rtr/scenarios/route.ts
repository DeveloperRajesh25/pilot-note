import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { opaqueId } from '@/lib/admin/ids';

export async function GET(request: NextRequest) {
  const check = await requireAdmin();
  if (check.error) return check.error;
  const { searchParams } = new URL(request.url);
  const testId = searchParams.get('testId');
  const db = createAdminClient();
  let query = db.from('rtr_scenarios_part2').select('*').order('id');
  if (testId) query = query.eq('test_id', testId);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ scenarios: data ?? [] });
}

export async function POST(request: NextRequest) {
  const check = await requireAdmin();
  if (check.error) return check.error;
  const body = await request.json();
  const { id, test_id, marks, scenario, instruction, exchanges } = body;
  if (!test_id || !scenario || !exchanges) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  const db = createAdminClient();
  const record: Record<string, unknown> = { test_id, marks: marks ?? 15, scenario, instruction, exchanges };
  record.id = id || opaqueId('rq2');
  const { data, error } = await db.from('rtr_scenarios_part2').insert(record).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ scenario: data }, { status: 201 });
}
