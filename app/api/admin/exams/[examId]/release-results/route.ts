import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { resultsEmailHtml, sendEmail } from '@/lib/email';

interface AttemptRow {
  id: string;
  user_id: string;
  score: number | null;
  total: number | null;
  submitted_at: string;
  auto_submitted: boolean | null;
  results_sent_at: string | null;
}

interface RegistrationRow {
  user_id: string;
  roll_no: string | null;
  dob: string | null;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ examId: string }> }
) {
  const { examId } = await params;
  const check = await requireAdmin();
  if (check.error) return check.error;

  const body = await request.json().catch(() => ({}));
  const dryRun: boolean = body?.dryRun === true;
  const resend: boolean = body?.resend === true;

  const db = createAdminClient();

  const { data: exam } = await db
    .from('exams')
    .select('id, title, subject, exam_date, start_at, end_at, pass_score, total_questions, results_released_at')
    .eq('id', examId)
    .maybeSingle();
  if (!exam) return NextResponse.json({ error: 'Exam not found' }, { status: 404 });

  // Only submitted attempts count.
  const { data: attemptsRaw } = await db
    .from('exam_attempts')
    .select('id, user_id, score, total, submitted_at, auto_submitted, results_sent_at')
    .eq('exam_id', examId)
    .not('submitted_at', 'is', null);
  const attempts = (attemptsRaw ?? []) as AttemptRow[];

  if (attempts.length === 0) {
    return NextResponse.json({ ok: true, message: 'No submitted attempts', sent: 0 });
  }

  // Rank: by score desc; ties get same rank (dense ranking). Within ties, earlier submission wins
  // for tiebreak ordering but rank number stays the same.
  const ranked = [...attempts].sort((a, b) => {
    const sa = a.score ?? 0, sb = b.score ?? 0;
    if (sb !== sa) return sb - sa;
    return new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime();
  });
  const rankMap = new Map<string, number>();
  let currentRank = 0;
  let prevScore = Number.NaN;
  ranked.forEach((a, idx) => {
    const score = a.score ?? 0;
    if (score !== prevScore) {
      currentRank = idx + 1;          // standard competition ranking ("1224")
      prevScore = score;
    }
    rankMap.set(a.id, currentRank);
  });

  // Persist rank on each attempt.
  for (const a of ranked) {
    const rank = rankMap.get(a.id)!;
    await db.from('exam_attempts').update({ rank }).eq('id', a.id);
  }

  // Registrations (for roll_no).
  const userIds = [...new Set(attempts.map((a) => a.user_id))];
  const { data: regsRaw } = await db
    .from('exam_registrations')
    .select('user_id, roll_no, dob')
    .eq('exam_id', examId)
    .in('user_id', userIds);
  const regMap = new Map<string, RegistrationRow>();
  for (const r of (regsRaw ?? []) as RegistrationRow[]) regMap.set(r.user_id, r);

  // Profiles (for email + name).
  const { data: profilesRaw } = await db
    .from('profiles')
    .select('id, email, full_name')
    .in('id', userIds);
  const profileMap = new Map<string, { email: string | null; full_name: string | null }>();
  for (const p of (profilesRaw ?? []) as { id: string; email: string | null; full_name: string | null }[]) {
    profileMap.set(p.id, p);
  }

  if (dryRun) {
    return NextResponse.json({
      ok: true,
      dryRun: true,
      attempts: attempts.length,
      ranked: ranked.length,
    });
  }

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? '').replace(/\/$/, '') || 'https://pilotnote.in';
  const totalCandidates = ranked.length;
  const passScore = exam.pass_score ?? 40;

  const errors: string[] = [];
  let sent = 0;
  const nowIso = new Date().toISOString();

  for (const a of ranked) {
    if (a.results_sent_at && !resend) continue;
    const profile = profileMap.get(a.user_id);
    const reg = regMap.get(a.user_id);
    if (!profile?.email) {
      errors.push(`user ${a.user_id}: no email`);
      continue;
    }
    const total = a.total ?? exam.total_questions ?? 0;
    const score = a.score ?? 0;
    const pct = total > 0 ? Math.round((score / total) * 100) : 0;
    const passed = pct >= passScore;
    const rank = rankMap.get(a.id) ?? 0;

    const html = resultsEmailHtml({
      fullName: profile.full_name,
      rollNo: reg?.roll_no ?? null,
      exam: {
        title: exam.title,
        subject: exam.subject,
        exam_date: exam.exam_date,
        start_at: exam.start_at,
        end_at: exam.end_at,
      },
      score,
      total,
      percentage: pct,
      rank,
      totalCandidates,
      passed,
      passScore,
      answersUrl: `${siteUrl}/pariksha/${examId}/answers`,
    });

    const r = await sendEmail({
      to: profile.email,
      subject: `Your result for ${exam.title}`,
      html,
    });
    if (r.ok) {
      sent++;
      await db.from('exam_attempts').update({ results_sent_at: nowIso }).eq('id', a.id);
    } else {
      errors.push(`${reg?.roll_no ?? a.user_id}: ${r.error}`);
    }
  }

  if (!exam.results_released_at && sent > 0) {
    await db.from('exams').update({ results_released_at: nowIso }).eq('id', examId);
  }

  return NextResponse.json({ ok: true, sent, ranked: ranked.length, errors });
}
