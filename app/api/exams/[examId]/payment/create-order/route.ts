import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createOrder } from '@/lib/razorpay';
import { isRegistrationOpen } from '@/lib/exam-status';

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
    .select('id, fee, status, start_at, end_at, exam_date, exam_time, duration, title')
    .eq('id', examId)
    .maybeSingle();

  if (!exam) {
    return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
  }

  if (exam.end_at && new Date(exam.end_at).getTime() < Date.now()) {
    return NextResponse.json({ error: 'Exam has already ended' }, { status: 410 });
  }

  // Registration window closed (exam is live/completed, or an admin closed it
  // early). Block new registrations server-side too — not just in the UI.
  if (!isRegistrationOpen(exam)) {
    return NextResponse.json({ error: 'Registration for this exam is closed.' }, { status: 403 });
  }

  // Free exam — tell the client to skip checkout. The registration row itself
  // is created when the candidate finalises via /register.
  if (!exam.fee || exam.fee <= 0) {
    const dbFree = createAdminClient();
    await dbFree.from('exam_registrations').upsert(
      { user_id: user.id, exam_id: examId },
      { onConflict: 'user_id,exam_id' }
    );
    return NextResponse.json({ free: true });
  }

  // Already-paid short-circuit — let the client skip checkout.
  const db = createAdminClient();
  const { data: paid } = await db
    .from('payments')
    .select('id, status')
    .eq('user_id', user.id)
    .eq('exam_id', examId)
    .eq('status', 'paid')
    .maybeSingle();

  // Ensure a (pending) registration row exists. On conflict this is a no-op —
  // payment_id and registered_at are preserved.
  await db.from('exam_registrations').upsert(
    { user_id: user.id, exam_id: examId },
    { onConflict: 'user_id,exam_id' }
  );

  if (paid) {
    return NextResponse.json({ alreadyPaid: true });
  }

  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  if (!keyId) {
    return NextResponse.json({ error: 'Payments not configured' }, { status: 500 });
  }

  try {
    const order = await createOrder({
      amount: exam.fee,
      currency: 'INR',
      receipt: `e_${examId.slice(0, 20)}_${user.id.slice(0, 8)}_${Date.now().toString(36).slice(-6)}`,
      notes: { exam_id: examId, user_id: user.id },
    });

    const { error: insertErr } = await db.from('payments').insert({
      user_id: user.id,
      exam_id: examId,
      provider: 'razorpay',
      order_id: order.id,
      amount: exam.fee,
      currency: 'INR',
      status: 'created',
      raw: order as unknown,
    });

    if (insertErr) {
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    return NextResponse.json({
      order_id: order.id,
      amount: order.amount,        // paise
      currency: order.currency,
      key_id: keyId,
      exam_title: exam.title,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Order creation failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
