import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { slugId } from '@/lib/admin/ids';

export async function GET() {
  const check = await requireAdmin();
  if (check.error) return check.error;
  const db = createAdminClient();
  const { data: exams } = await db.from('exams').select('*').order('exam_date', { ascending: true });
  const { data: counts } = await db.from('exam_registration_counts').select('*');
  const { data: qRows } = await db.from('exam_questions').select('exam_id');
  const countMap: Record<string, number> = {};
  (counts ?? []).forEach((c: { exam_id: string; registration_count: number | string }) => {
    countMap[c.exam_id] = Number(c.registration_count);
  });
  const questionCountMap: Record<string, number> = {};
  (qRows ?? []).forEach((row: { exam_id: string }) => {
    questionCountMap[row.exam_id] = (questionCountMap[row.exam_id] ?? 0) + 1;
  });
  const enriched = (exams ?? []).map((e: { id: string }) => ({
    ...e,
    registrations: countMap[e.id] ?? 0,
    question_count: questionCountMap[e.id] ?? 0,
  }));
  return NextResponse.json({ exams: enriched });
}

export async function POST(request: NextRequest) {
  const check = await requireAdmin();
  if (check.error) return check.error;
  const body = await request.json();
  const {
    id, title, subject, description, exam_date, exam_time, duration, total_questions, fee, original_fee, status,
    start_at, end_at, per_question_seconds, pass_score, payment_provider,
  } = body;
  if (!title || !subject) return NextResponse.json({ error: 'title and subject required' }, { status: 400 });
  const feeNum = Number(fee ?? 499);
  if (!Number.isFinite(feeNum) || feeNum < 0) {
    return NextResponse.json({ error: 'Fee must be 0 (free) or a positive amount' }, { status: 400 });
  }
  const originalFeeRaw = original_fee === '' || original_fee === undefined || original_fee === null ? null : Number(original_fee);
  if (originalFeeRaw !== null && (!Number.isFinite(originalFeeRaw) || originalFeeRaw < 0)) {
    return NextResponse.json({ error: 'Original fee must be blank or a non-negative amount' }, { status: 400 });
  }
  if (originalFeeRaw !== null && originalFeeRaw < feeNum) {
    return NextResponse.json({ error: 'Original fee must be greater than the live fee to show a discount' }, { status: 400 });
  }
  const db = createAdminClient();
  const record: Record<string, unknown> = {
    title,
    subject,
    description,
    exam_date,
    exam_time,
    duration: duration ?? 120,
    total_questions: total_questions ?? 100,
    fee: feeNum,
    original_fee: originalFeeRaw,
    status: status ?? 'Upcoming',
    start_at: start_at || null,
    end_at: end_at || null,
    per_question_seconds: per_question_seconds ?? 60,
    pass_score: pass_score ?? 40,
    payment_provider: payment_provider ?? 'razorpay',
  };
  record.id = id || slugId(title);
  const { data, error } = await db.from('exams').insert(record).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ exam: data }, { status: 201 });
}
