-- ============================================================
-- PILOT NOTE — SUPABASE SCHEMA
-- Run this entire script in Supabase SQL Editor (one shot)
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- 1. PROFILES
-- ============================================================
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  full_name   text,
  avatar_url  text,
  created_at  timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Auto-create profile on new user signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- 2. APTITUDE QUESTIONS
-- ============================================================
create table if not exists public.aptitude_questions (
  id          text primary key,
  category    text not null,
  question    text not null,
  options     jsonb not null,   -- string[]
  correct     int  not null,
  explanation text,
  created_at  timestamptz default now()
);

alter table public.aptitude_questions enable row level security;

create policy "Anyone can read aptitude questions"
  on public.aptitude_questions for select
  using (true);

-- ============================================================
-- 3. APTITUDE RESULTS
-- ============================================================
create table if not exists public.aptitude_results (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  category    text not null,  -- 'Full COMPASS Test' or individual category
  score       int  not null,
  total       int  not null,
  time_taken  int  not null,  -- seconds
  answers     jsonb,          -- {question_id: selected_option_index}
  created_at  timestamptz default now()
);

alter table public.aptitude_results enable row level security;

create policy "Users can view own aptitude results"
  on public.aptitude_results for select
  using (auth.uid() = user_id);

create policy "Users can insert own aptitude results"
  on public.aptitude_results for insert
  with check (auth.uid() = user_id);

-- ============================================================
-- 4. RTR TESTS
-- ============================================================
create table if not exists public.rtr_tests (
  id          text primary key,
  title       text not null,
  description text,
  price       int  not null default 299,
  status      text not null default 'active',
  created_at  timestamptz default now()
);

alter table public.rtr_tests enable row level security;

create policy "Anyone can read RTR tests"
  on public.rtr_tests for select
  using (true);

-- ============================================================
-- 5. RTR PART 1 QUESTIONS
-- ============================================================
create table if not exists public.rtr_questions_part1 (
  id          text primary key,
  test_id     text not null references public.rtr_tests(id) on delete cascade,
  question    text not null,
  options     jsonb not null,
  correct     int  not null,
  explanation text,
  created_at  timestamptz default now()
);

alter table public.rtr_questions_part1 enable row level security;

-- Only users who purchased can read questions — policy relies on user_purchases
create policy "Purchased users can read RTR Part 1 questions"
  on public.rtr_questions_part1 for select
  using (
    exists (
      select 1 from public.user_purchases
      where user_id = auth.uid() and test_id = rtr_questions_part1.test_id
    )
  );

-- ============================================================
-- 6. RTR PART 2 SCENARIOS
-- ============================================================
create table if not exists public.rtr_scenarios_part2 (
  id          text primary key,
  test_id     text not null references public.rtr_tests(id) on delete cascade,
  marks       int  not null,
  scenario    text not null,
  instruction text,
  exchanges   jsonb not null,  -- {role, text?, prompt?, expectedAnswer?}[]
  created_at  timestamptz default now()
);

alter table public.rtr_scenarios_part2 enable row level security;

create policy "Purchased users can read RTR Part 2 scenarios"
  on public.rtr_scenarios_part2 for select
  using (
    exists (
      select 1 from public.user_purchases
      where user_id = auth.uid() and test_id = rtr_scenarios_part2.test_id
    )
  );

-- ============================================================
-- 7. USER PURCHASES
-- ============================================================
create table if not exists public.user_purchases (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  test_id       text not null references public.rtr_tests(id) on delete cascade,
  amount        int  not null default 0,
  payment_id    text,           -- Razorpay order id (or 'simulated')
  purchased_at  timestamptz default now(),
  unique(user_id, test_id)
);

alter table public.user_purchases enable row level security;

create policy "Users can view own purchases"
  on public.user_purchases for select
  using (auth.uid() = user_id);

create policy "Users can insert own purchases"
  on public.user_purchases for insert
  with check (auth.uid() = user_id);

-- ============================================================
-- 8. RTR RESULTS
-- ============================================================
create table if not exists public.rtr_results (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  test_id     text not null references public.rtr_tests(id) on delete cascade,
  part        text not null check (part in ('part1', 'part2')),
  score       int  not null,
  total       int  not null,
  answers     jsonb,
  created_at  timestamptz default now()
);

alter table public.rtr_results enable row level security;

create policy "Users can view own RTR results"
  on public.rtr_results for select
  using (auth.uid() = user_id);

create policy "Users can insert own RTR results"
  on public.rtr_results for insert
  with check (auth.uid() = user_id);

-- ============================================================
-- 9. GUIDES
-- ============================================================
create table if not exists public.guides (
  id          text primary key,
  title       text not null,
  category    text not null,
  summary     text,
  content     text,
  read_time   text,
  difficulty  text,
  published   boolean default true,
  created_at  timestamptz default now()
);

alter table public.guides enable row level security;

create policy "Anyone can read published guides"
  on public.guides for select
  using (published = true);

-- ============================================================
-- 10. EXAMS (PARIKSHA)
-- ============================================================
create table if not exists public.exams (
  id               text primary key,
  title            text not null,
  subject          text not null,
  description      text,
  exam_date        date,
  exam_time        text,
  duration         int  not null default 120,   -- minutes
  total_questions  int  not null default 100,
  fee              int  not null default 0,
  status           text not null default 'Upcoming',  -- Upcoming, Active, Completed
  created_at       timestamptz default now()
);

alter table public.exams enable row level security;

create policy "Anyone can read exams"
  on public.exams for select
  using (true);

-- ============================================================
-- 11. EXAM QUESTIONS
-- ============================================================
create table if not exists public.exam_questions (
  id          uuid primary key default uuid_generate_v4(),
  exam_id     text not null references public.exams(id) on delete cascade,
  question    text not null,
  options     jsonb not null,
  correct     int  not null,
  explanation text,
  created_at  timestamptz default now()
);

alter table public.exam_questions enable row level security;

create policy "Registered users can read exam questions"
  on public.exam_questions for select
  using (
    exists (
      select 1 from public.exam_registrations
      where user_id = auth.uid() and exam_id = exam_questions.exam_id
    )
  );

-- ============================================================
-- 12. EXAM REGISTRATIONS
-- ============================================================
create table if not exists public.exam_registrations (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  exam_id       text not null references public.exams(id) on delete cascade,
  payment_id    text,
  registered_at timestamptz default now(),
  unique(user_id, exam_id)
);

alter table public.exam_registrations enable row level security;

create policy "Users can view own registrations"
  on public.exam_registrations for select
  using (auth.uid() = user_id);

create policy "Users can insert own registrations"
  on public.exam_registrations for insert
  with check (auth.uid() = user_id);

-- ============================================================
-- 13. EXAM ATTEMPTS
-- ============================================================
create table if not exists public.exam_attempts (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  exam_id      text not null references public.exams(id) on delete cascade,
  answers      jsonb,           -- {question_uuid: selected_index}
  score        int,
  total        int,
  started_at   timestamptz default now(),
  submitted_at timestamptz,
  unique(user_id, exam_id)     -- one attempt per user per exam
);

alter table public.exam_attempts enable row level security;

create policy "Users can view own exam attempts"
  on public.exam_attempts for select
  using (auth.uid() = user_id);

create policy "Users can insert own exam attempts"
  on public.exam_attempts for insert
  with check (auth.uid() = user_id);

create policy "Users can update own exam attempts"
  on public.exam_attempts for update
  using (auth.uid() = user_id);

-- ============================================================
-- 14. REGISTRATIONS COUNT VIEW (public, for exam cards)
-- ============================================================
create or replace view public.exam_registration_counts as
  select exam_id, count(*) as registration_count
  from public.exam_registrations
  group by exam_id;
