-- ============================================================
-- PILOT NOTE — ADMIN SCHEMA ADDITIONS
-- Run AFTER schema.sql in Supabase SQL Editor
-- ============================================================

-- ============================================================
-- ADMIN ROLES TABLE
-- ============================================================
create table if not exists public.admin_roles (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references auth.users(id) on delete cascade unique,
  role       text not null default 'admin',
  created_at timestamptz default now()
);

alter table public.admin_roles enable row level security;

-- Only admins can read admin_roles
create policy "Admins can read admin_roles"
  on public.admin_roles for select
  using (
    exists (select 1 from public.admin_roles ar where ar.user_id = auth.uid())
  );

-- Helper function: is current user an admin?
create or replace function public.is_admin()
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.admin_roles where user_id = auth.uid());
$$;

-- ============================================================
-- ADMIN POLICIES — profiles
-- ============================================================
create policy "Admins can read all profiles"
  on public.profiles for select
  using (public.is_admin());

create policy "Admins can update all profiles"
  on public.profiles for update
  using (public.is_admin());

-- ============================================================
-- ADMIN POLICIES — aptitude_questions (write)
-- ============================================================
create policy "Admins can insert aptitude questions"
  on public.aptitude_questions for insert
  with check (public.is_admin());

create policy "Admins can update aptitude questions"
  on public.aptitude_questions for update
  using (public.is_admin());

create policy "Admins can delete aptitude questions"
  on public.aptitude_questions for delete
  using (public.is_admin());

-- ============================================================
-- ADMIN POLICIES — aptitude_results
-- ============================================================
create policy "Admins can read all aptitude results"
  on public.aptitude_results for select
  using (public.is_admin());

-- ============================================================
-- ADMIN POLICIES — rtr_tests
-- ============================================================
create policy "Admins can insert RTR tests"
  on public.rtr_tests for insert
  with check (public.is_admin());

create policy "Admins can update RTR tests"
  on public.rtr_tests for update
  using (public.is_admin());

create policy "Admins can delete RTR tests"
  on public.rtr_tests for delete
  using (public.is_admin());

-- ============================================================
-- ADMIN POLICIES — rtr_questions_part1
-- ============================================================
create policy "Admins can read all RTR Part 1 questions"
  on public.rtr_questions_part1 for select
  using (public.is_admin());

create policy "Admins can insert RTR Part 1 questions"
  on public.rtr_questions_part1 for insert
  with check (public.is_admin());

create policy "Admins can update RTR Part 1 questions"
  on public.rtr_questions_part1 for update
  using (public.is_admin());

create policy "Admins can delete RTR Part 1 questions"
  on public.rtr_questions_part1 for delete
  using (public.is_admin());

-- ============================================================
-- ADMIN POLICIES — rtr_scenarios_part2
-- ============================================================
create policy "Admins can read all RTR Part 2 scenarios"
  on public.rtr_scenarios_part2 for select
  using (public.is_admin());

create policy "Admins can insert RTR Part 2 scenarios"
  on public.rtr_scenarios_part2 for insert
  with check (public.is_admin());

create policy "Admins can update RTR Part 2 scenarios"
  on public.rtr_scenarios_part2 for update
  using (public.is_admin());

create policy "Admins can delete RTR Part 2 scenarios"
  on public.rtr_scenarios_part2 for delete
  using (public.is_admin());

-- ============================================================
-- ADMIN POLICIES — user_purchases
-- ============================================================
create policy "Admins can read all purchases"
  on public.user_purchases for select
  using (public.is_admin());

create policy "Admins can delete purchases"
  on public.user_purchases for delete
  using (public.is_admin());

-- ============================================================
-- ADMIN POLICIES — rtr_results
-- ============================================================
create policy "Admins can read all RTR results"
  on public.rtr_results for select
  using (public.is_admin());

-- ============================================================
-- ADMIN POLICIES — guides (write)
-- ============================================================
create policy "Admins can insert guides"
  on public.guides for insert
  with check (public.is_admin());

create policy "Admins can update guides"
  on public.guides for update
  using (public.is_admin());

create policy "Admins can delete guides"
  on public.guides for delete
  using (public.is_admin());

create policy "Admins can read all guides"
  on public.guides for select
  using (public.is_admin());

-- ============================================================
-- ADMIN POLICIES — exams (write)
-- ============================================================
create policy "Admins can insert exams"
  on public.exams for insert
  with check (public.is_admin());

create policy "Admins can update exams"
  on public.exams for update
  using (public.is_admin());

create policy "Admins can delete exams"
  on public.exams for delete
  using (public.is_admin());

-- ============================================================
-- ADMIN POLICIES — exam_questions (write)
-- ============================================================
create policy "Admins can read all exam questions"
  on public.exam_questions for select
  using (public.is_admin());

create policy "Admins can insert exam questions"
  on public.exam_questions for insert
  with check (public.is_admin());

create policy "Admins can update exam questions"
  on public.exam_questions for update
  using (public.is_admin());

create policy "Admins can delete exam questions"
  on public.exam_questions for delete
  using (public.is_admin());

-- ============================================================
-- ADMIN POLICIES — exam_registrations
-- ============================================================
create policy "Admins can read all exam registrations"
  on public.exam_registrations for select
  using (public.is_admin());

-- ============================================================
-- ADMIN POLICIES — exam_attempts
-- ============================================================
create policy "Admins can read all exam attempts"
  on public.exam_attempts for select
  using (public.is_admin());

-- ============================================================
-- MAKE YOURSELF ADMIN
-- Replace the UUID below with your Supabase auth.users UUID
-- Run: SELECT id FROM auth.users WHERE email = 'your@email.com';
-- Then: INSERT INTO public.admin_roles (user_id) VALUES ('YOUR-UUID-HERE');
-- ============================================================
