import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  const check = await requireAdmin();
  if (check.error) return check.error;
  const db = createAdminClient();
  const { data: exams } = await db.from('exams').select('*').order('exam_date', { ascending: true });
  const { data: counts } = await db.from('exam_registration_counts').select('*');
  const countMap: Record<string, number> = {};
  (counts ?? []).forEach((c: any) => { countMap[c.exam_id] = Number(c.registration_count); });
  const enriched = (exams ?? []).map((e: any) => ({ ...e, registrations: countMap[e.id] ?? 0 }));
  return NextResponse.json({ exams: enriched });
}

export async function POST(request: NextRequest) {
  const check = await requireAdmin();
  if (check.error) return check.error;
  const body = await request.json();
  const { id, title, subject, description, exam_date, exam_time, duration, total_questions, fee, status } = body;
  if (!title || !subject) return NextResponse.json({ error: 'title and subject required' }, { status: 400 });
  const db = createAdminClient();
  const record: any = { title, subject, description, exam_date, exam_time, duration: duration ?? 120, total_questions: total_questions ?? 100, fee: fee ?? 499, status: status ?? 'Upcoming' };
  if (id) record.id = id;
  const { data, error } = await db.from('exams').insert(record).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ exam: data }, { status: 201 });
}
