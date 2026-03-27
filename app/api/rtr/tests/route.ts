import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: tests, error } = await supabase
    .from('rtr_tests')
    .select('*')
    .eq('status', 'active')
    .order('id');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Attach purchase status per test
  let purchasedTestIds: string[] = [];
  if (user) {
    const { data: purchases } = await supabase
      .from('user_purchases')
      .select('test_id')
      .eq('user_id', user.id);
    purchasedTestIds = (purchases ?? []).map((p: { test_id: string }) => p.test_id);
  }

  const testsWithPurchase = (tests ?? []).map((t: Record<string, unknown>) => ({
    ...t,
    isPurchased: purchasedTestIds.includes(t.id as string),
  }));

  return NextResponse.json({ tests: testsWithPurchase });
}
