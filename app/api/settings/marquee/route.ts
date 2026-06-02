import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const DEFAULT_ITEMS = [
  'DGCA CPL & ATPL',
  'Air Navigation',
  'Meteorology',
  'Aviation Met',
  'Air Regulations',
  'Technical General',
  'COMPASS Aptitude',
  'Class 1 Medical',
  'Pariksha National Mocks',
  'Phraseology',
];

export async function GET() {
  try {
    const db = createClient();
    const { data } = await db
      .from('site_settings')
      .select('value')
      .eq('key', 'marquee_items')
      .single();

    const items: string[] = Array.isArray(data?.value) ? data.value : DEFAULT_ITEMS;
    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ items: DEFAULT_ITEMS });
  }
}
