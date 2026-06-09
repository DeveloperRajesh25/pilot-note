import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest, { params }: { params: Promise<{ chapterId: string }> }) {
  const { chapterId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Login required' }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (
    !body ||
    typeof body.score !== 'number' ||
    typeof body.total !== 'number' ||
    !Array.isArray(body.answers)
  ) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const { score, total, answers } = body as { score: number; total: number; answers: (number | null)[] };

  const db = createAdminClient();
  const { error } = await db.from('dgca_practice_results').insert({
    user_id: user.id,
    chapter_id: chapterId,
    score,
    total,
    answers,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
