import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyPaymentSignature } from '@/lib/razorpay';

export async function POST(request: NextRequest, { params }: { params: Promise<{ chapterId: string }> }) {
  const { chapterId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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
  if (!valid) return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });

  const db = createAdminClient();

  // Confirm the order belongs to this user + chapter (defence in depth).
  const { data: payment } = await db
    .from('dgca_payments')
    .select('id, user_id, chapter_id, amount, status')
    .eq('order_id', razorpay_order_id)
    .maybeSingle();

  if (!payment || payment.user_id !== user.id || payment.chapter_id !== chapterId) {
    return NextResponse.json({ error: 'Order not recognised' }, { status: 404 });
  }

  if (payment.status !== 'paid') {
    const { error: updErr } = await db
      .from('dgca_payments')
      .update({
        status: 'paid',
        payment_id: razorpay_payment_id,
        signature: razorpay_signature,
        updated_at: new Date().toISOString(),
      })
      .eq('id', payment.id);
    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });
  }

  // Durable ownership record. Idempotent on (user_id, chapter_id).
  const { error: purchaseErr } = await db
    .from('dgca_chapter_purchases')
    .upsert(
      {
        user_id: user.id,
        chapter_id: chapterId,
        amount: payment.amount,
        payment_id: razorpay_payment_id,
      },
      { onConflict: 'user_id,chapter_id' }
    );
  if (purchaseErr) return NextResponse.json({ error: purchaseErr.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
