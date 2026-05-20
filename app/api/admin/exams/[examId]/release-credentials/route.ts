import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { credentialsEmailHtml, sendEmail } from '@/lib/email';

interface RegistrationRow {
  id: string;
  user_id: string;
  exam_id: string;
  dob: string | null;
  roll_no: string | null;
  payment_id: string | null;
  credentials_sent_at: string | null;
}

/**
 * Build a roll number like "PIL-AN-2026-0042".
 *   PIL : Pilot Note prefix (constant)
 *   AN  : First two letters of subject ("Air Navigation" → "AN")
 *   YYYY: Year from exam_date
 *   0042: Zero-padded ordinal within this exam, by registration time.
 */
function buildRollNo(subject: string, year: number, ordinal: number): string {
  const subj = subject
    .split(/\s+/)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
    .slice(0, 3) || 'EX';
  return `PIL-${subj}-${year}-${String(ordinal).padStart(4, '0')}`;
}

function formatDobForHint(dob: string): string {
  const [y, m, d] = dob.split('-');
  return `${d}/${m}/${y} — enter as ${d}${m}${y} (DDMMYYYY).`;
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
  // When true, also re-send to candidates who already received credentials.
  const resend: boolean = body?.resend === true;

  const db = createAdminClient();

  const { data: exam } = await db
    .from('exams')
    .select('id, title, subject, exam_date, start_at, end_at, credentials_released_at')
    .eq('id', examId)
    .maybeSingle();
  if (!exam) return NextResponse.json({ error: 'Exam not found' }, { status: 404 });

  // Only paid registrations with a DOB are eligible.
  const { data: regsRaw } = await db
    .from('exam_registrations')
    .select('id, user_id, exam_id, dob, roll_no, payment_id, credentials_sent_at, registered_at')
    .eq('exam_id', examId)
    .order('registered_at', { ascending: true });
  const regs = (regsRaw ?? []) as (RegistrationRow & { registered_at: string })[];

  const eligible = regs.filter((r) => r.payment_id && r.dob);
  const missingDob = regs.filter((r) => r.payment_id && !r.dob);

  if (eligible.length === 0) {
    return NextResponse.json({
      ok: true,
      message: 'No eligible registrations',
      total: regs.length,
      missingDob: missingDob.length,
      sent: 0,
    });
  }

  // Fetch profile (email + name) for everyone.
  const userIds = [...new Set(eligible.map((r) => r.user_id))];
  const { data: profilesRaw } = await db
    .from('profiles')
    .select('id, email, full_name')
    .in('id', userIds);
  const profileMap = new Map<string, { email: string | null; full_name: string | null }>();
  for (const p of (profilesRaw ?? []) as { id: string; email: string | null; full_name: string | null }[]) {
    profileMap.set(p.id, p);
  }

  const year = exam.exam_date ? new Date(exam.exam_date).getUTCFullYear() : new Date().getUTCFullYear();
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? '').replace(/\/$/, '') || 'https://pilotnote.in';
  const loginUrl = `${siteUrl}/pariksha/login?exam=${encodeURIComponent(examId)}`;

  // First pass: assign roll numbers in registration order (existing roll_nos are preserved).
  // We compute the next ordinal from the max already-assigned roll_no in this exam.
  const existingRolls = eligible.map((r) => r.roll_no).filter((x): x is string => !!x);
  let nextOrdinal =
    existingRolls.reduce((max, rn) => {
      const m = rn.match(/(\d+)$/);
      const n = m ? parseInt(m[1], 10) : 0;
      return n > max ? n : max;
    }, 0) + 1;

  const assignments: { regId: string; rollNo: string }[] = [];
  for (const r of eligible) {
    if (r.roll_no) continue;
    const rollNo = buildRollNo(exam.subject, year, nextOrdinal++);
    assignments.push({ regId: r.id, rollNo });
  }

  if (dryRun) {
    return NextResponse.json({
      ok: true,
      dryRun: true,
      eligible: eligible.length,
      toAssign: assignments.length,
      missingDob: missingDob.length,
      previewLoginUrl: loginUrl,
    });
  }

  // Persist roll-no assignments.
  for (const a of assignments) {
    await db.from('exam_registrations').update({ roll_no: a.rollNo }).eq('id', a.regId);
  }

  // Reload to pick up persisted roll numbers.
  const { data: refreshedRaw } = await db
    .from('exam_registrations')
    .select('id, user_id, dob, roll_no, credentials_sent_at')
    .eq('exam_id', examId)
    .not('roll_no', 'is', null);
  const refreshed = (refreshedRaw ?? []) as Pick<
    RegistrationRow,
    'id' | 'user_id' | 'dob' | 'roll_no' | 'credentials_sent_at'
  >[];

  // Send emails (skip already-sent unless resend=true).
  const errors: string[] = [];
  let sent = 0;
  const nowIso = new Date().toISOString();

  for (const r of refreshed) {
    if (!r.roll_no || !r.dob) continue;
    if (r.credentials_sent_at && !resend) continue;
    const profile = profileMap.get(r.user_id);
    if (!profile?.email) {
      errors.push(`${r.roll_no}: no email on profile`);
      continue;
    }
    const html = credentialsEmailHtml({
      fullName: profile.full_name,
      rollNo: r.roll_no,
      dobPasswordHint: formatDobForHint(r.dob),
      exam: {
        title: exam.title,
        subject: exam.subject,
        exam_date: exam.exam_date,
        start_at: exam.start_at,
        end_at: exam.end_at,
      },
      loginUrl,
    });
    const res = await sendEmail({
      to: profile.email,
      subject: `Your credentials for ${exam.title}`,
      html,
    });
    if (res.ok) {
      sent++;
      await db.from('exam_registrations').update({ credentials_sent_at: nowIso }).eq('id', r.id);
    } else {
      errors.push(`${r.roll_no}: ${res.error}`);
    }
  }

  // Mark the exam as released the first time we send anything.
  if (!exam.credentials_released_at && sent > 0) {
    await db.from('exams').update({ credentials_released_at: nowIso }).eq('id', examId);
  }

  return NextResponse.json({
    ok: true,
    sent,
    assigned: assignments.length,
    eligible: eligible.length,
    missingDob: missingDob.length,
    errors,
  });
}
