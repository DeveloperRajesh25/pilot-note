import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// POST — finalise a registration after a successful payment.
// Free exams (fee=0) skip the payment check.
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

  const { data: exam } = await supabase
    .from('exams')
    .select('id, fee, status, end_at')
    .eq('id', examId)
    .maybeSingle();

  if (!exam) {
    return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
  }

  if (exam.end_at && new Date(exam.end_at).getTime() < Date.now()) {
    return NextResponse.json({ error: 'Exam has already ended' }, { status: 410 });
  }

  // Already registered? Treat as success.
  const { data: existing } = await supabase
    .from('exam_registrations')
    .select('id')
    .eq('user_id', user.id)
    .eq('exam_id', examId)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ message: 'Already registered', alreadyRegistered: true });
  }

  // Paid exams require a verified payment.
  if (exam.fee > 0) {
    const db = createAdminClient();
    const { data: payment } = await db
      .from('payments')
      .select('id, payment_id, status')
      .eq('user_id', user.id)
      .eq('exam_id', examId)
      .eq('status', 'paid')
      .maybeSingle();

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment required', requiresPayment: true },
        { status: 402 }
      );
    }

    const { data, error } = await db
      .from('exam_registrations')
      .insert({
        user_id: user.id,
        exam_id: examId,
        payment_id: payment.payment_id,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ registration: data, success: true }, { status: 201 });
  }

  // Free exam path. DOB was pre-bound by /payment/create-order's free short-circuit;
  // if for any reason the row doesn't exist yet, create it (without DOB — the
  // candidate will be prompted to set DOB on the credentials page).
  const dbFree = createAdminClient();
  const { data, error } = await dbFree
    .from('exam_registrations')
    .upsert(
      { user_id: user.id, exam_id: examId, payment_id: null },
      { onConflict: 'user_id,exam_id', ignoreDuplicates: false }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ registration: data, success: true }, { status: 201 });
}
