import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createOrder } from '@/lib/razorpay';

export async function POST(_request: NextRequest, { params }: { params: Promise<{ chapterId: string }> }) {
  const { chapterId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = createAdminClient();
  const { data: chapter } = await db
    .from('dgca_chapters')
    .select('id, title, price, status')
    .eq('id', chapterId)
    .maybeSingle();

  if (!chapter || chapter.status !== 'active') {
    return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
  }

  // Free chapter — nothing to pay.
  if (!chapter.price || chapter.price <= 0) {
    return NextResponse.json({ free: true });
  }

  // Already owned — let the client skip checkout.
  const { data: existing } = await db
    .from('dgca_chapter_purchases')
    .select('id')
    .eq('user_id', user.id)
    .eq('chapter_id', chapterId)
    .maybeSingle();
  if (existing) return NextResponse.json({ alreadyOwned: true });

  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  if (!keyId) return NextResponse.json({ error: 'Payments not configured' }, { status: 500 });

  try {
    const order = await createOrder({
      amount: chapter.price,
      currency: 'INR',
      receipt: `dc_${chapterId.slice(0, 18)}_${user.id.slice(0, 8)}_${Date.now().toString(36).slice(-6)}`,
      notes: { chapter_id: chapterId, user_id: user.id },
    });

    const { error: insertErr } = await db.from('dgca_payments').insert({
      user_id: user.id,
      chapter_id: chapterId,
      provider: 'razorpay',
      order_id: order.id,
      amount: chapter.price,
      currency: 'INR',
      status: 'created',
      raw: order as unknown,
    });
    if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });

    return NextResponse.json({
      order_id: order.id,
      amount: order.amount, // paise
      currency: order.currency,
      key_id: keyId,
      chapter_title: chapter.title,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Order creation failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
