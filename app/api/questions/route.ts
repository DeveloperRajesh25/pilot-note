import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');

  const supabase = await createClient();

  let query = supabase.from('aptitude_questions').select('*').order('id');
  if (category && category !== 'all') {
    query = query.eq('category', category);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Shuffle for fresh experience
  const shuffled = data ? [...data].sort(() => Math.random() - 0.5) : [];
  return NextResponse.json({ questions: shuffled });
}
