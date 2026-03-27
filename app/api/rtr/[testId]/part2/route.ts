import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ testId: string }> }
) {
  const { testId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check purchase
  const { data: purchase } = await supabase
    .from('user_purchases')
    .select('id')
    .eq('user_id', user.id)
    .eq('test_id', testId)
    .maybeSingle();

  if (!purchase) {
    return NextResponse.json({ error: 'Not purchased' }, { status: 403 });
  }

  const { data: scenarios, error } = await supabase
    .from('rtr_scenarios_part2')
    .select('*')
    .eq('test_id', testId)
    .order('id');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ scenarios: scenarios ?? [] });
}
