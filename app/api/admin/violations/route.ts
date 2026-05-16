import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import type { ViolationEvent } from '@/lib/types';

interface AttemptRow {
  id: string;
  user_id: string;
  exam_id: string;
  violations: ViolationEvent[] | null;
  auto_submitted: boolean | null;
  started_at: string;
  submitted_at: string | null;
  last_seen_at: string | null;
}

export async function GET() {
  const check = await requireAdmin();
  if (check.error) return check.error;
  const db = createAdminClient();

  // Pull every attempt with a non-empty violations array. The column defaults
  // to `[]`, so we cannot filter on IS NOT NULL — use jsonb array length via
  // a PostgREST-friendly path: fetch all, filter client-side. Volumes are tiny.
  const { data: attemptsRaw, error: attemptsErr } = await db
    .from('exam_attempts')
    .select('id, user_id, exam_id, violations, auto_submitted, started_at, submitted_at, last_seen_at')
    .order('last_seen_at', { ascending: false, nullsFirst: false });

  if (attemptsErr) {
    return NextResponse.json({ error: attemptsErr.message }, { status: 500 });
  }

  const attempts = ((attemptsRaw ?? []) as AttemptRow[]).filter(
    (a) => Array.isArray(a.violations) && a.violations.length > 0,
  );

  if (attempts.length === 0) {
    return NextResponse.json({ rows: [] });
  }

  // Hydrate users + exams separately — avoids depending on PostgREST inferring
  // the indirect FK path exam_attempts.user_id → auth.users.id ← profiles.id,
  // which can silently return null in some environments.
  const userIds = Array.from(new Set(attempts.map((a) => a.user_id)));
  const examIds = Array.from(new Set(attempts.map((a) => a.exam_id)));

  const [profilesRes, examsRes] = await Promise.all([
    db.from('profiles').select('id, email, full_name').in('id', userIds),
    db.from('exams').select('id, title, subject').in('id', examIds),
  ]);

  const profilesMap = new Map<string, { email: string | null; full_name: string | null }>();
  (profilesRes.data ?? []).forEach((p: { id: string; email: string | null; full_name: string | null }) => {
    profilesMap.set(p.id, { email: p.email, full_name: p.full_name });
  });

  const examsMap = new Map<string, { title: string | null; subject: string | null }>();
  (examsRes.data ?? []).forEach((e: { id: string; title: string | null; subject: string | null }) => {
    examsMap.set(e.id, { title: e.title, subject: e.subject });
  });

  const rows = attempts
    .map((a) => {
      const violations = (a.violations ?? []) as ViolationEvent[];
      const summary: Record<string, number> = {};
      for (const v of violations) {
        summary[v.type] = (summary[v.type] ?? 0) + 1;
      }
      const lastAt = violations.reduce<string | null>((acc, v) => (!acc || v.at > acc ? v.at : acc), null);
      const profile = profilesMap.get(a.user_id);
      const exam = examsMap.get(a.exam_id);
      return {
        attempt_id: a.id,
        user_id: a.user_id,
        exam_id: a.exam_id,
        exam_title: exam?.title ?? null,
        exam_subject: exam?.subject ?? null,
        user_email: profile?.email ?? null,
        user_name: profile?.full_name ?? null,
        total: violations.length,
        summary,
        last_at: lastAt,
        auto_submitted: a.auto_submitted ?? false,
        started_at: a.started_at,
        submitted_at: a.submitted_at,
        violations,
      };
    })
    .sort((a, b) => (b.last_at ?? '').localeCompare(a.last_at ?? ''));

  return NextResponse.json({ rows });
}
