import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const check = await requireAdmin();
  if (check.error) return check.error;
  const { id } = await params;
  const body = await request.json();

  const patch: Record<string, unknown> = {};
  if (typeof body.question === 'string') patch.question = body.question.trim();
  if (Array.isArray(body.options)) {
    const options = (body.options as unknown[]).map((o) => (typeof o === 'string' ? o.trim() : ''));
    if (options.length < 2 || options.some((o) => !o)) {
      return NextResponse.json({ error: 'all options must be filled (min 2)' }, { status: 400 });
    }
    patch.options = options;
  }
  if (body.correct !== undefined) {
    const correct = Number(body.correct);
    if (!Number.isInteger(correct) || correct < 0) {
      return NextResponse.json({ error: 'invalid correct index' }, { status: 400 });
    }
    patch.correct = correct;
  }
  if (body.explanation !== undefined) {
    patch.explanation = typeof body.explanation === 'string' ? body.explanation.trim() || null : null;
  }
  if (body.image_url !== undefined) {
    patch.image_url = typeof body.image_url === 'string' ? body.image_url.trim() || null : null;
  }
  if (Object.keys(patch).length === 0) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });

  const db = createAdminClient();

  // Bounds-check `correct` against the effective option count (provided options,
  // else the existing row's), mirroring the POST/bulk guards so an edit can't
  // leave an unanswerable question.
  if (patch.correct !== undefined) {
    let optionCount: number;
    if (Array.isArray(patch.options)) {
      optionCount = (patch.options as string[]).length;
    } else {
      const { data: existing } = await db.from('dgca_questions').select('options').eq('id', id).maybeSingle();
      optionCount = Array.isArray(existing?.options) ? (existing!.options as unknown[]).length : 0;
    }
    if ((patch.correct as number) >= optionCount) {
      return NextResponse.json({ error: 'correct index out of range' }, { status: 400 });
    }
  }

  const { data, error } = await db.from('dgca_questions').update(patch).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ question: data });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const check = await requireAdmin();
  if (check.error) return check.error;
  const { id } = await params;
  const db = createAdminClient();
  const { error } = await db.from('dgca_questions').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
