import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  // Purchases count
  const { count: purchaseCount } = await supabase
    .from('user_purchases')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id);

  // RTR results
  const { data: rtrResults } = await supabase
    .from('rtr_results')
    .select('id, test_id, part, score, total, created_at, rtr_tests(title)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10);

  // Aptitude results
  const { data: aptitudeResults } = await supabase
    .from('aptitude_results')
    .select('id, category, score, total, time_taken, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10);

  // Exam registrations
  const { count: examRegCount } = await supabase
    .from('exam_registrations')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id);

  // Exam attempts
  const { data: examAttempts } = await supabase
    .from('exam_attempts')
    .select('exam_id, score, total, submitted_at, exams(title, subject)')
    .eq('user_id', user.id)
    .not('submitted_at', 'is', null)
    .order('submitted_at', { ascending: false })
    .limit(5);

  return NextResponse.json({
    profile: {
      id: user.id,
      email: user.email,
      full_name: profile?.full_name ?? null,
      avatar_url: profile?.avatar_url ?? null,
      created_at: profile?.created_at ?? user.created_at,
    },
    stats: {
      purchaseCount: purchaseCount ?? 0,
      rtrAttempts: (rtrResults ?? []).length,
      aptitudeAttempts: (aptitudeResults ?? []).length,
      examRegistrations: examRegCount ?? 0,
    },
    rtrResults: rtrResults ?? [],
    aptitudeResults: aptitudeResults ?? [],
    examAttempts: examAttempts ?? [],
  });
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { full_name } = body;

  const { data, error } = await supabase
    .from('profiles')
    .upsert({ id: user.id, email: user.email, full_name }, { onConflict: 'id' })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ profile: data });
}
