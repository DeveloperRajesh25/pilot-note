import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { test_id, part, score, total, answers } = body;

  if (!test_id || !part || typeof score !== 'number' || typeof total !== 'number') {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  // Verify purchase
  const { data: purchase } = await supabase
    .from('user_purchases')
    .select('id')
    .eq('user_id', user.id)
    .eq('test_id', test_id)
    .maybeSingle();

  if (!purchase) {
    return NextResponse.json({ error: 'Not purchased' }, { status: 403 });
  }

  const { data, error } = await supabase
    .from('rtr_results')
    .insert({
      user_id: user.id,
      test_id,
      part,
      score,
      total,
      answers: answers ?? {},
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ result: data }, { status: 201 });
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('rtr_results')
    .select('*, rtr_tests(title)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ results: data });
}
