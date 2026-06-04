import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { GUIDES as STATIC_GUIDES } from '@/app/constants/data';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');

  const supabase = await createClient();

  let query = supabase
    .from('guides')
    .select('id, title, category, summary, read_time, difficulty')
    .eq('published', true)
    .order('created_at', { ascending: true });

  if (category && category !== 'all') {
    query = query.eq('category', category);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // When the database has no published guides yet, surface the curated static
  // guides so the page isn't an empty shell for new visitors.
  if (!data || data.length === 0) {
    const fallback = STATIC_GUIDES
      .filter((g) => !category || category === 'all' || g.category === category)
      .map(({ id, title, category, summary, readTime, difficulty }) => ({
        id,
        title,
        category,
        summary,
        read_time: readTime,
        difficulty,
      }));
    return NextResponse.json({ guides: fallback });
  }

  return NextResponse.json({ guides: data });
}
