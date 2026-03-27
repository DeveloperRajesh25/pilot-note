import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: exams, error } = await supabase
    .from('exams')
    .select('*')
    .order('exam_date', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Get registration counts
  const { data: counts } = await supabase
    .from('exam_registration_counts')
    .select('*');

  const countMap: Record<string, number> = {};
  (counts ?? []).forEach((c: { exam_id: string; registration_count: number }) => {
    countMap[c.exam_id] = Number(c.registration_count);
  });

  // Get current user's registrations
  let userRegs: string[] = [];
  if (user) {
    const { data: regs } = await supabase
      .from('exam_registrations')
      .select('exam_id')
      .eq('user_id', user.id);
    userRegs = (regs ?? []).map((r: { exam_id: string }) => r.exam_id);
  }

  // Get current user's submitted attempts
  let submissions: string[] = [];
  if (user) {
    const { data: attempts } = await supabase
      .from('exam_attempts')
      .select('exam_id')
      .eq('user_id', user.id)
      .not('submitted_at', 'is', null);
    submissions = (attempts ?? []).map((a: { exam_id: string }) => a.exam_id);
  }

  const enriched = (exams ?? []).map((e: Record<string, unknown>) => ({
    ...e,
    registrations: countMap[e.id as string] ?? 0,
    isRegistered: userRegs.includes(e.id as string),
    hasAttempted: submissions.includes(e.id as string),
  }));

  return NextResponse.json({ exams: enriched });
}
