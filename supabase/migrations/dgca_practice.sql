-- ============================================================
-- DGCA PRACTICE — CPL / ATPL → Subject → Chapter → MCQ practice
-- + per-chapter Razorpay pricing, and admin-published Pariksha toppers.
--
-- Mirrors the conventions in supabase/full_setup.sql:
--   * text primary keys (slugs) for content rows
--   * uuid pk + auth.users fk for per-user rows
--   * RLS on every table; public read for content, admin-only writes
--   * payments lifecycle table (created → paid) + ownership table,
--     exactly like public.payments + public.exam_registrations.
--
-- Safe to run multiple times (idempotent: create-if-not-exists + drop/create
-- policies). Run in the Supabase SQL editor.
-- ============================================================

create extension if not exists "uuid-ossp";

-- ------------------------------------------------------------
-- 1. CONTENT TABLES
-- ------------------------------------------------------------

-- Courses: CPL, ATPL (admin-managed — admin can add/rename/remove).
create table if not exists public.dgca_courses (
  id          text primary key,
  name        text not null,
  slug        text not null unique,
  sort_order  int  not null default 0,
  created_at  timestamptz default now()
);
alter table public.dgca_courses enable row level security;

-- Subjects belong to a course (e.g. "Aviation Meteorology" under CPL).
create table if not exists public.dgca_subjects (
  id          text primary key,
  course_id   text not null references public.dgca_courses(id) on delete cascade,
  name        text not null,
  slug        text not null,
  sort_order  int  not null default 0,
  created_at  timestamptz default now(),
  unique(course_id, slug)
);
alter table public.dgca_subjects enable row level security;
create index if not exists dgca_subjects_course_idx on public.dgca_subjects(course_id);

-- Chapters belong to a subject and carry the price (0 = free).
create table if not exists public.dgca_chapters (
  id          text primary key,
  subject_id  text not null references public.dgca_subjects(id) on delete cascade,
  title       text not null,
  description text,
  price       int  not null default 0,           -- rupees; 0 = free
  status      text not null default 'active',     -- 'active' | 'inactive'
  sort_order  int  not null default 0,
  created_at  timestamptz default now()
);
alter table public.dgca_chapters enable row level security;
create index if not exists dgca_chapters_subject_idx on public.dgca_chapters(subject_id);

-- MCQ questions belong to a chapter.
create table if not exists public.dgca_questions (
  id          text primary key,
  chapter_id  text not null references public.dgca_chapters(id) on delete cascade,
  question    text not null,
  options     jsonb not null,
  correct     int  not null,
  explanation text,
  image_url   text,
  created_at  timestamptz default now()
);
alter table public.dgca_questions enable row level security;
create index if not exists dgca_questions_chapter_idx on public.dgca_questions(chapter_id);

-- ------------------------------------------------------------
-- 2. PAYMENTS + OWNERSHIP (mirrors public.payments + exam_registrations)
-- ------------------------------------------------------------

-- Razorpay order lifecycle for paid chapters.
create table if not exists public.dgca_payments (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  chapter_id  text not null references public.dgca_chapters(id) on delete cascade,
  provider    text not null default 'razorpay',
  order_id    text not null unique,
  payment_id  text,
  signature   text,
  amount      int  not null,
  currency    text not null default 'INR',
  status      text not null default 'created',     -- 'created' | 'paid' | 'failed'
  raw         jsonb,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);
alter table public.dgca_payments enable row level security;
create index if not exists dgca_payments_user_chapter_idx on public.dgca_payments(user_id, chapter_id);

-- Durable ownership record — created on successful payment verification.
create table if not exists public.dgca_chapter_purchases (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  chapter_id    text not null references public.dgca_chapters(id) on delete cascade,
  amount        int  not null default 0,
  payment_id    text,
  purchased_at  timestamptz default now(),
  unique(user_id, chapter_id)
);
alter table public.dgca_chapter_purchases enable row level security;

-- ------------------------------------------------------------
-- 3. PARIKSHA TOPPERS (admin-published Top 10 leaderboard)
-- ------------------------------------------------------------
create table if not exists public.pariksha_toppers (
  id            uuid primary key default uuid_generate_v4(),
  rank          int  not null,
  student_name  text not null,
  subject       text,
  marks         int,
  total_marks   int,
  photo_url     text,
  exam_label    text,
  published     boolean not null default true,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);
alter table public.pariksha_toppers enable row level security;

-- ------------------------------------------------------------
-- 4. POLICIES
-- ------------------------------------------------------------
do $$
begin
  -- Courses — public read, admin write.
  execute 'drop policy if exists "Anyone can read dgca courses" on public.dgca_courses';
  create policy "Anyone can read dgca courses" on public.dgca_courses for select using (true);
  execute 'drop policy if exists "Admins manage dgca courses" on public.dgca_courses';
  create policy "Admins manage dgca courses" on public.dgca_courses for all using (public.is_admin()) with check (public.is_admin());

  -- Subjects — public read, admin write.
  execute 'drop policy if exists "Anyone can read dgca subjects" on public.dgca_subjects';
  create policy "Anyone can read dgca subjects" on public.dgca_subjects for select using (true);
  execute 'drop policy if exists "Admins manage dgca subjects" on public.dgca_subjects';
  create policy "Admins manage dgca subjects" on public.dgca_subjects for all using (public.is_admin()) with check (public.is_admin());

  -- Chapters — public read, admin write.
  execute 'drop policy if exists "Anyone can read dgca chapters" on public.dgca_chapters';
  create policy "Anyone can read dgca chapters" on public.dgca_chapters for select using (true);
  execute 'drop policy if exists "Admins manage dgca chapters" on public.dgca_chapters';
  create policy "Admins manage dgca chapters" on public.dgca_chapters for all using (public.is_admin()) with check (public.is_admin());

  -- Questions — readable if the chapter is free OR the user has purchased it.
  -- Anonymous users (auth.uid() null) can still read free-chapter questions.
  execute 'drop policy if exists "Read dgca questions when free or purchased" on public.dgca_questions';
  create policy "Read dgca questions when free or purchased" on public.dgca_questions for select using (
    exists (select 1 from public.dgca_chapters c where c.id = dgca_questions.chapter_id and c.price = 0)
    or exists (
      select 1 from public.dgca_chapter_purchases p
      where p.user_id = auth.uid() and p.chapter_id = dgca_questions.chapter_id
    )
  );
  execute 'drop policy if exists "Admins manage dgca questions" on public.dgca_questions';
  create policy "Admins manage dgca questions" on public.dgca_questions for all using (public.is_admin()) with check (public.is_admin());

  -- Payments — user reads own; admin reads all. Writes go through service role.
  execute 'drop policy if exists "Users view own dgca payments" on public.dgca_payments';
  create policy "Users view own dgca payments" on public.dgca_payments for select using (auth.uid() = user_id);
  execute 'drop policy if exists "Admins read dgca payments" on public.dgca_payments';
  create policy "Admins read dgca payments" on public.dgca_payments for select using (public.is_admin());

  -- Chapter purchases — user reads own; admin reads all.
  execute 'drop policy if exists "Users view own dgca purchases" on public.dgca_chapter_purchases';
  create policy "Users view own dgca purchases" on public.dgca_chapter_purchases for select using (auth.uid() = user_id);
  execute 'drop policy if exists "Admins read dgca purchases" on public.dgca_chapter_purchases';
  create policy "Admins read dgca purchases" on public.dgca_chapter_purchases for select using (public.is_admin());

  -- Toppers — public reads published rows; admin manages all.
  execute 'drop policy if exists "Anyone can read published toppers" on public.pariksha_toppers';
  create policy "Anyone can read published toppers" on public.pariksha_toppers for select using (published = true);
  execute 'drop policy if exists "Admins manage toppers" on public.pariksha_toppers';
  create policy "Admins manage toppers" on public.pariksha_toppers for all using (public.is_admin()) with check (public.is_admin());
end $$;

-- ------------------------------------------------------------
-- 5. STORAGE — public bucket for chapter question images + topper photos
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('dgca-uploads', 'dgca-uploads', true)
on conflict (id) do update set public = true;

-- A public bucket already serves objects through the public object endpoint
-- WITHOUT any storage.objects RLS policy. We deliberately grant NO anon SELECT
-- policy: doing so would let anonymous clients enumerate (list) every object
-- path and harvest paid-chapter question diagrams. Files stay reachable only by
-- their exact randomized URL — the same posture as the rtr-question-attachments
-- bucket. All writes go through the service-role client, which bypasses RLS.
-- (Drop any such policy left by an earlier run of this migration.)
do $$
begin
  execute 'drop policy if exists "Public read dgca-uploads" on storage.objects';
end $$;

-- ------------------------------------------------------------
-- 6. SEED — the courses/subjects from the planning sketch (idempotent).
--    Chapters + MCQs are uploaded from the admin panel.
-- ------------------------------------------------------------
insert into public.dgca_courses (id, name, slug, sort_order) values
  ('cpl', 'CPL', 'cpl', 1),
  ('atpl', 'ATPL', 'atpl', 2)
on conflict (id) do nothing;

insert into public.dgca_subjects (id, course_id, name, slug, sort_order) values
  ('cpl-aviation-meteorology', 'cpl', 'Aviation Meteorology', 'aviation-meteorology', 1),
  ('cpl-air-regulations',      'cpl', 'Air Regulations',      'air-regulations',      2),
  ('cpl-air-navigation',       'cpl', 'Air Navigation',       'air-navigation',       3),
  ('cpl-rtr-part-1',           'cpl', 'RTR Part-1',           'rtr-part-1',           4),
  ('cpl-technical-general',    'cpl', 'Technical General',    'technical-general',    5),
  ('cpl-technical-specific',   'cpl', 'Technical Specific',   'technical-specific',   6),
  ('atpl-aviation-meteorology','atpl','Aviation Meteorology', 'aviation-meteorology', 1),
  ('atpl-air-navigation',      'atpl','Air Navigation',       'air-navigation',       2),
  ('atpl-radio-aids-instruments','atpl','Radio Aids & Instruments','radio-aids-instruments',3)
on conflict (id) do nothing;
