import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ examId: string }> }
) {
  const { examId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check exam exists
  const { data: exam } = await supabase
    .from('exams')
    .select('id, fee, status')
    .eq('id', examId)
    .maybeSingle();

  if (!exam) {
    return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
  }

  // Check already registered
  const { data: existing } = await supabase
    .from('exam_registrations')
    .select('id')
    .eq('user_id', user.id)
    .eq('exam_id', examId)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ message: 'Already registered', alreadyRegistered: true });
  }

  const { data, error } = await supabase
    .from('exam_registrations')
    .insert({
      user_id: user.id,
      exam_id: examId,
      payment_id: 'simulated',
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ registration: data, success: true }, { status: 201 });
}
