import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { test_id } = body;

  if (!test_id) {
    return NextResponse.json({ error: 'test_id required' }, { status: 400 });
  }

  // Check test exists and is active
  const { data: test } = await supabase
    .from('rtr_tests')
    .select('id, price, status')
    .eq('id', test_id)
    .eq('status', 'active')
    .maybeSingle();

  if (!test) {
    return NextResponse.json({ error: 'Test not found' }, { status: 404 });
  }

  // Check if already purchased
  const { data: existing } = await supabase
    .from('user_purchases')
    .select('id')
    .eq('user_id', user.id)
    .eq('test_id', test_id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ message: 'Already purchased', alreadyOwned: true });
  }

  // Simulated purchase — in production, verify Razorpay payment_id here
  const payment_id = body.payment_id || 'simulated';

  const { data, error } = await supabase
    .from('user_purchases')
    .insert({
      user_id: user.id,
      test_id,
      amount: (test as Record<string, unknown>).price as number ?? 299,
      payment_id,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ purchase: data, success: true }, { status: 201 });
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('user_purchases')
    .select('*, rtr_tests(title, description)')
    .eq('user_id', user.id)
    .order('purchased_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ purchases: data });
}
