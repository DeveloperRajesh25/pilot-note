import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyWebhookSignature } from '@/lib/razorpay';

// Status transition guard: only allow forward progression.
const NEXT_STATUS: Record<string, Set<string>> = {
  created: new Set(['paid', 'failed']),
  paid: new Set(['refunded']),
  failed: new Set(['paid']),       // user retried successfully
  refunded: new Set([]),
};

interface WebhookPayment {
  id: string;
  order_id: string;
  status: string;
  amount?: number;
  notes?: Record<string, string>;
}

interface WebhookPayload {
  event: string;
  payload: {
    payment?: { entity: WebhookPayment };
    refund?: { entity: { payment_id: string; status: string } };
  };
}

export async function POST(request: NextRequest) {
  // Razorpay signs the raw body. We must NOT JSON-parse before verifying.
  const rawBody = await request.text();
  const signature = request.headers.get('x-razorpay-signature') ?? '';

  let valid = false;
  try {
    valid = verifyWebhookSignature(rawBody, signature);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Webhook misconfigured' },
      { status: 500 }
    );
  }

  if (!valid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  let payload: WebhookPayload;
  try {
    payload = JSON.parse(rawBody) as WebhookPayload;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const db = createAdminClient();
  const event = payload.event;

  if (event === 'payment.captured' || event === 'payment.authorized' || event === 'payment.failed') {
    const p = payload.payload.payment?.entity;
    if (!p?.order_id) return NextResponse.json({ ok: true });

    const { data: row } = await db
      .from('payments')
      .select('id, status, user_id, exam_id')
      .eq('order_id', p.order_id)
      .maybeSingle();

    if (!row) return NextResponse.json({ ok: true });

    const nextStatus =
      event === 'payment.failed' ? 'failed' :
      'paid';

    const allowed = NEXT_STATUS[row.status]?.has(nextStatus);
    if (!allowed) return NextResponse.json({ ok: true });

    await db
      .from('payments')
      .update({
        status: nextStatus,
        payment_id: p.id,
        raw: p as unknown,
        updated_at: new Date().toISOString(),
      })
      .eq('id', row.id);

    // Mirror to registrations on capture (idempotent).
    if (nextStatus === 'paid') {
      await db.from('exam_registrations').upsert(
        { user_id: row.user_id, exam_id: row.exam_id, payment_id: p.id },
        { onConflict: 'user_id,exam_id' }
      );
    }
  } else if (event === 'refund.created' || event === 'refund.processed') {
    const r = payload.payload.refund?.entity;
    if (!r?.payment_id) return NextResponse.json({ ok: true });

    const { data: row } = await db
      .from('payments')
      .select('id, status')
      .eq('payment_id', r.payment_id)
      .maybeSingle();

    if (!row) return NextResponse.json({ ok: true });
    if (!NEXT_STATUS[row.status]?.has('refunded')) return NextResponse.json({ ok: true });

    await db
      .from('payments')
      .update({ status: 'refunded', updated_at: new Date().toISOString() })
      .eq('id', row.id);
  }

  return NextResponse.json({ ok: true });
}
