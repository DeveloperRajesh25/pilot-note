-- ============================================================
-- PARIKSHA v3 — credential release, ranked results, answer key
-- Run this AFTER full_setup.sql.
-- ============================================================

-- 1. exams: track when admin released credentials and results
alter table public.exams
  add column if not exists credentials_released_at  timestamptz,
  add column if not exists results_released_at      timestamptz;

-- 2. exam_registrations: DOB + per-exam unique roll number
alter table public.exam_registrations
  add column if not exists dob                date,
  add column if not exists roll_no            text,
  add column if not exists credentials_sent_at timestamptz;

-- Roll numbers are unique per exam (PIL2026-AN-001 style)
create unique index if not exists exam_registrations_exam_roll_unique
  on public.exam_registrations(exam_id, roll_no)
  where roll_no is not null;

-- 3. exam_attempts: rank + when the user was emailed their result
alter table public.exam_attempts
  add column if not exists rank             int,
  add column if not exists results_sent_at  timestamptz;

-- 4. Admins can update exam_registrations (for roll-no assignment)
do $$
begin
  execute 'drop policy if exists "Admins can update exam registrations" on public.exam_registrations';
  create policy "Admins can update exam registrations" on public.exam_registrations
    for update using (public.is_admin());

  execute 'drop policy if exists "Admins can update exam attempts" on public.exam_attempts';
  create policy "Admins can update exam attempts" on public.exam_attempts
    for update using (public.is_admin());

  -- After results are released, the registered user can see explanations for their attempt
  -- via a server endpoint (we keep RLS read of correct/explanation gated to admins; the API
  -- joins server-side).
end $$;

-- 5. Helper view: leaderboard / ranking input
create or replace view public.exam_results_with_profile as
  select
    a.id, a.user_id, a.exam_id,
    a.score, a.total, a.submitted_at, a.auto_submitted,
    a.rank, a.results_sent_at,
    p.email, p.full_name,
    r.roll_no, r.dob
  from public.exam_attempts a
  left join public.profiles p on p.id = a.user_id
  left join public.exam_registrations r on r.user_id = a.user_id and r.exam_id = a.exam_id
  where a.submitted_at is not null;
