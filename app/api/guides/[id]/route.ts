import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { GUIDES as STATIC_GUIDES } from '@/app/constants/data';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('guides')
    .select('*')
    .eq('id', id)
    .eq('published', true)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (data) {
    return NextResponse.json({ guide: data });
  }

  // Fall back to the static guide if not found in the DB.
  const staticGuide = STATIC_GUIDES.find((g) => g.id === id);
  if (staticGuide) {
    return NextResponse.json({
      guide: {
        ...staticGuide,
        read_time: staticGuide.readTime,
        published: true,
      },
    });
  }

  return NextResponse.json({ error: 'Guide not found' }, { status: 404 });
}
