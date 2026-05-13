import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyPaymentSignature } from '@/lib/razorpay';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ examId: string }> }
) {
  const { examId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body ?? {};

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return NextResponse.json({ error: 'Missing payment fields' }, { status: 400 });
  }

  const valid = verifyPaymentSignature({
    order_id: razorpay_order_id,
    payment_id: razorpay_payment_id,
    signature: razorpay_signature,
  });

  if (!valid) {
    return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
  }

  const db = createAdminClient();

  // Make sure the order belongs to this user + exam (defence in depth).
  const { data: payment } = await db
    .from('payments')
    .select('id, user_id, exam_id, status')
    .eq('order_id', razorpay_order_id)
    .maybeSingle();

  if (!payment || payment.user_id !== user.id || payment.exam_id !== examId) {
    return NextResponse.json({ error: 'Order not recognised' }, { status: 404 });
  }

  if (payment.status !== 'paid') {
    const { error: updErr } = await db
      .from('payments')
      .update({
        status: 'paid',
        payment_id: razorpay_payment_id,
        signature: razorpay_signature,
        updated_at: new Date().toISOString(),
      })
      .eq('id', payment.id);
    if (updErr) {
      return NextResponse.json({ error: updErr.message }, { status: 500 });
    }
  }

  // Idempotent registration insert. Unique (user_id, exam_id) prevents duplicates.
  const { error: regErr } = await db
    .from('exam_registrations')
    .upsert(
      {
        user_id: user.id,
        exam_id: examId,
        payment_id: razorpay_payment_id,
      },
      { onConflict: 'user_id,exam_id' }
    );

  if (regErr) {
    return NextResponse.json({ error: regErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
