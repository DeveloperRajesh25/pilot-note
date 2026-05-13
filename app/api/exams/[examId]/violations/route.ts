import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { ViolationEvent, ViolationType } from '@/lib/types';

const VALID_TYPES: ViolationType[] = [
  'tab_hidden',
  'window_blur',
  'fullscreen_exit',
  'right_click',
  'devtools_key',
  'clipboard',
];

interface IncomingViolation {
  type: ViolationType;
  meta?: Record<string, unknown>;
}

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

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object' || !VALID_TYPES.includes(body.type)) {
    return NextResponse.json({ error: 'Invalid violation' }, { status: 400 });
  }
  const incoming = body as IncomingViolation;

  // Pull existing attempt + violations.
  const { data: attempt } = await supabase
    .from('exam_attempts')
    .select('id, violations, submitted_at')
    .eq('user_id', user.id)
    .eq('exam_id', examId)
    .maybeSingle();

  // Silently ignore if the attempt doesn't exist or is already submitted —
  // we don't want to leak state to a misbehaving client.
  if (!attempt || attempt.submitted_at) {
    return NextResponse.json({ ok: true });
  }

  const existing: ViolationEvent[] = Array.isArray(attempt.violations) ? attempt.violations : [];

  // Server-side dedupe: drop if the same type fired within the last 2 seconds.
  const nowMs = Date.now();
  const last = existing[existing.length - 1];
  if (last && last.type === incoming.type) {
    const lastMs = new Date(last.at).getTime();
    if (nowMs - lastMs < 2000) {
      return NextResponse.json({ ok: true, deduped: true });
    }
  }

  const event: ViolationEvent = {
    type: incoming.type,
    at: new Date(nowMs).toISOString(),
    ...(incoming.meta ? { meta: incoming.meta } : {}),
  };

  const { error } = await supabase
    .from('exam_attempts')
    .update({ violations: [...existing, event] })
    .eq('id', attempt.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
