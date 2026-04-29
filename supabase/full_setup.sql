-- ============================================================
-- PILOT NOTE — FULL UNIFIED SETUP
-- Includes: Base Schema + Admin Roles + Policies + Seed Data
-- Run this in Supabase SQL Editor (one-shot)
-- ============================================================

-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";

-- 2. TABLES (Base Schema)
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  full_name   text,
  avatar_url  text,
  created_at  timestamptz default now()
);

alter table public.profiles enable row level security;

create table if not exists public.aptitude_questions (
  id          text primary key,
  category    text not null,
  question    text not null,
  options     jsonb not null,
  correct     int  not null,
  explanation text,
  created_at  timestamptz default now()
);

alter table public.aptitude_questions enable row level security;

create table if not exists public.aptitude_results (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  category    text not null,
  score       int  not null,
  total       int  not null,
  time_taken  int  not null,
  answers     jsonb,
  created_at  timestamptz default now()
);

alter table public.aptitude_results enable row level security;

create table if not exists public.rtr_tests (
  id          text primary key,
  title       text not null,
  description text,
  price       int  not null default 299,
  status      text not null default 'active',
  created_at  timestamptz default now()
);

alter table public.rtr_tests enable row level security;

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

create table if not exists public.rtr_scenarios_part2 (
  id            text primary key,
  test_id       text not null references public.rtr_tests(id) on delete cascade,
  marks         int  not null,
  scenario      text not null,
  instruction   text,
  exchanges     jsonb,
  chart_context jsonb,
  questions     jsonb,
  created_at    timestamptz default now()
);

-- Backfill new columns for installs that pre-date the chart-paper redesign.
alter table public.rtr_scenarios_part2 alter column exchanges drop not null;
alter table public.rtr_scenarios_part2 add column if not exists chart_context jsonb;
alter table public.rtr_scenarios_part2 add column if not exists questions jsonb;

alter table public.rtr_scenarios_part2 enable row level security;

create table if not exists public.user_purchases (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  test_id       text not null references public.rtr_tests(id) on delete cascade,
  amount        int  not null default 0,
  payment_id    text,
  purchased_at  timestamptz default now(),
  unique(user_id, test_id)
);

alter table public.user_purchases enable row level security;

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

create table if not exists public.exams (
  id               text primary key,
  title            text not null,
  subject          text not null,
  description      text,
  exam_date        date,
  exam_time        text,
  duration         int  not null default 120,
  total_questions  int  not null default 100,
  fee              int  not null default 0,
  status           text not null default 'Upcoming',
  created_at       timestamptz default now()
);

alter table public.exams enable row level security;

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

create table if not exists public.exam_registrations (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  exam_id       text not null references public.exams(id) on delete cascade,
  payment_id    text,
  registered_at timestamptz default now(),
  unique(user_id, exam_id)
);

alter table public.exam_registrations enable row level security;

create table if not exists public.exam_attempts (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  exam_id      text not null references public.exams(id) on delete cascade,
  answers      jsonb,
  score        int,
  total        int,
  started_at   timestamptz default now(),
  submitted_at timestamptz,
  unique(user_id, exam_id)
);

alter table public.exam_attempts enable row level security;

-- 3. ADMIN ROLES TABLE
create table if not exists public.admin_roles (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references auth.users(id) on delete cascade unique,
  role       text not null default 'admin',
  created_at timestamptz default now()
);

alter table public.admin_roles enable row level security;

-- 4. FUNCTIONS & TRIGGERS
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

create or replace function public.is_admin()
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.admin_roles where user_id = auth.uid());
$$;

-- 5. POLICIES (Public & Shared)
do $$
begin
  -- Profiles
  execute 'drop policy if exists "Users can view own profile" on public.profiles';
  create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
  execute 'drop policy if exists "Users can update own profile" on public.profiles';
  create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
  execute 'drop policy if exists "Users can insert own profile" on public.profiles';
  create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

  -- Aptitude Questions
  execute 'drop policy if exists "Anyone can read aptitude questions" on public.aptitude_questions';
  create policy "Anyone can read aptitude questions" on public.aptitude_questions for select using (true);

  -- Aptitude Results
  execute 'drop policy if exists "Users can view own aptitude results" on public.aptitude_results';
  create policy "Users can view own aptitude results" on public.aptitude_results for select using (auth.uid() = user_id);
  execute 'drop policy if exists "Users can insert own aptitude results" on public.aptitude_results';
  create policy "Users can insert own aptitude results" on public.aptitude_results for insert with check (auth.uid() = user_id);

  -- RTR Tests
  execute 'drop policy if exists "Anyone can read RTR tests" on public.rtr_tests';
  create policy "Anyone can read RTR tests" on public.rtr_tests for select using (true);

  -- RTR Part 1 Questions
  execute 'drop policy if exists "Purchased users can read RTR Part 1 questions" on public.rtr_questions_part1';
  create policy "Purchased users can read RTR Part 1 questions" on public.rtr_questions_part1 for select using (exists (select 1 from public.user_purchases where user_id = auth.uid() and test_id = rtr_questions_part1.test_id));

  -- RTR Part 2 Scenarios
  execute 'drop policy if exists "Purchased users can read RTR Part 2 scenarios" on public.rtr_scenarios_part2';
  create policy "Purchased users can read RTR Part 2 scenarios" on public.rtr_scenarios_part2 for select using (exists (select 1 from public.user_purchases where user_id = auth.uid() and test_id = rtr_scenarios_part2.test_id));

  -- User Purchases
  execute 'drop policy if exists "Users can view own purchases" on public.user_purchases';
  create policy "Users can view own purchases" on public.user_purchases for select using (auth.uid() = user_id);
  execute 'drop policy if exists "Users can insert own purchases" on public.user_purchases';
  create policy "Users can insert own purchases" on public.user_purchases for insert with check (auth.uid() = user_id);

  -- RTR Results
  execute 'drop policy if exists "Users can view own RTR results" on public.rtr_results';
  create policy "Users can view own RTR results" on public.rtr_results for select using (auth.uid() = user_id);
  execute 'drop policy if exists "Users can insert own RTR results" on public.rtr_results';
  create policy "Users can insert own RTR results" on public.rtr_results for insert with check (auth.uid() = user_id);

  -- Guides
  execute 'drop policy if exists "Anyone can read published guides" on public.guides';
  create policy "Anyone can read published guides" on public.guides for select using (published = true);

  -- Exams
  execute 'drop policy if exists "Anyone can read exams" on public.exams';
  create policy "Anyone can read exams" on public.exams for select using (true);

  -- Exam Questions
  execute 'drop policy if exists "Registered users can read exam questions" on public.exam_questions';
  create policy "Registered users can read exam questions" on public.exam_questions for select using (exists (select 1 from public.exam_registrations where user_id = auth.uid() and exam_id = exam_questions.exam_id));

  -- Exam Registrations
  execute 'drop policy if exists "Users can view own registrations" on public.exam_registrations';
  create policy "Users can view own registrations" on public.exam_registrations for select using (auth.uid() = user_id);
  execute 'drop policy if exists "Users can insert own registrations" on public.exam_registrations';
  create policy "Users can insert own registrations" on public.exam_registrations for insert with check (auth.uid() = user_id);

  -- Exam Attempts
  execute 'drop policy if exists "Users can view own exam attempts" on public.exam_attempts';
  create policy "Users can view own exam attempts" on public.exam_attempts for select using (auth.uid() = user_id);
  execute 'drop policy if exists "Users can insert own exam attempts" on public.exam_attempts';
  create policy "Users can insert own exam attempts" on public.exam_attempts for insert with check (auth.uid() = user_id);
  execute 'drop policy if exists "Users can update own exam attempts" on public.exam_attempts';
  create policy "Users can update own exam attempts" on public.exam_attempts for update using (auth.uid() = user_id);
end $$;

-- 6. ADMIN POLICIES
do $$
begin
  -- Admin Roles — each user can read their own row.
  -- A self-referential `exists (select … from admin_roles)` policy here
  -- triggers "infinite recursion detected in policy" when the user-scoped
  -- client checks its own admin status.
  execute 'drop policy if exists "Admins can read admin_roles" on public.admin_roles';
  execute 'drop policy if exists "Users can read own admin_role" on public.admin_roles';
  create policy "Users can read own admin_role" on public.admin_roles for select using (user_id = auth.uid());

  -- Profiles
  execute 'drop policy if exists "Admins can read all profiles" on public.profiles';
  create policy "Admins can read all profiles" on public.profiles for select using (public.is_admin());
  execute 'drop policy if exists "Admins can update all profiles" on public.profiles';
  create policy "Admins can update all profiles" on public.profiles for update using (public.is_admin());

  -- Aptitude
  execute 'drop policy if exists "Admins can insert aptitude questions" on public.aptitude_questions';
  create policy "Admins can insert aptitude questions" on public.aptitude_questions for insert with check (public.is_admin());
  execute 'drop policy if exists "Admins can update aptitude questions" on public.aptitude_questions';
  create policy "Admins can update aptitude questions" on public.aptitude_questions for update using (public.is_admin());
  execute 'drop policy if exists "Admins can delete aptitude questions" on public.aptitude_questions';
  create policy "Admins can delete aptitude questions" on public.aptitude_questions for delete using (public.is_admin());
  execute 'drop policy if exists "Admins can read all aptitude results" on public.aptitude_results';
  create policy "Admins can read all aptitude results" on public.aptitude_results for select using (public.is_admin());

  -- RTR
  execute 'drop policy if exists "Admins can insert RTR tests" on public.rtr_tests';
  create policy "Admins can insert RTR tests" on public.rtr_tests for insert with check (public.is_admin());
  execute 'drop policy if exists "Admins can update RTR tests" on public.rtr_tests';
  create policy "Admins can update RTR tests" on public.rtr_tests for update using (public.is_admin());
  execute 'drop policy if exists "Admins can delete RTR tests" on public.rtr_tests';
  create policy "Admins can delete RTR tests" on public.rtr_tests for delete using (public.is_admin());
  execute 'drop policy if exists "Admins can read all RTR Part 1 questions" on public.rtr_questions_part1';
  create policy "Admins can read all RTR Part 1 questions" on public.rtr_questions_part1 for select using (public.is_admin());
  execute 'drop policy if exists "Admins can insert RTR Part 1 questions" on public.rtr_questions_part1';
  create policy "Admins can insert RTR Part 1 questions" on public.rtr_questions_part1 for insert with check (public.is_admin());
  execute 'drop policy if exists "Admins can update RTR Part 1 questions" on public.rtr_questions_part1';
  create policy "Admins can update RTR Part 1 questions" on public.rtr_questions_part1 for update using (public.is_admin());
  execute 'drop policy if exists "Admins can delete RTR Part 1 questions" on public.rtr_questions_part1';
  create policy "Admins can delete RTR Part 1 questions" on public.rtr_questions_part1 for delete using (public.is_admin());
  execute 'drop policy if exists "Admins can read all RTR Part 2 scenarios" on public.rtr_scenarios_part2';
  create policy "Admins can read all RTR Part 2 scenarios" on public.rtr_scenarios_part2 for select using (public.is_admin());
  execute 'drop policy if exists "Admins can insert RTR Part 2 scenarios" on public.rtr_scenarios_part2';
  create policy "Admins can insert RTR Part 2 scenarios" on public.rtr_scenarios_part2 for insert with check (public.is_admin());
  execute 'drop policy if exists "Admins can update RTR Part 2 scenarios" on public.rtr_scenarios_part2';
  create policy "Admins can update RTR Part 2 scenarios" on public.rtr_scenarios_part2 for update using (public.is_admin());
  execute 'drop policy if exists "Admins can delete RTR Part 2 scenarios" on public.rtr_scenarios_part2';
  create policy "Admins can delete RTR Part 2 scenarios" on public.rtr_scenarios_part2 for delete using (public.is_admin());

  -- Purchases & Results
  execute 'drop policy if exists "Admins can read all purchases" on public.user_purchases';
  create policy "Admins can read all purchases" on public.user_purchases for select using (public.is_admin());
  execute 'drop policy if exists "Admins can delete purchases" on public.user_purchases';
  create policy "Admins can delete purchases" on public.user_purchases for delete using (public.is_admin());
  execute 'drop policy if exists "Admins can read all RTR results" on public.rtr_results';
  create policy "Admins can read all RTR results" on public.rtr_results for select using (public.is_admin());

  -- Guides
  execute 'drop policy if exists "Admins can insert guides" on public.guides';
  create policy "Admins can insert guides" on public.guides for insert with check (public.is_admin());
  execute 'drop policy if exists "Admins can update guides" on public.guides';
  create policy "Admins can update guides" on public.guides for update using (public.is_admin());
  execute 'drop policy if exists "Admins can delete guides" on public.guides';
  create policy "Admins can delete guides" on public.guides for delete using (public.is_admin());
  execute 'drop policy if exists "Admins can read all guides" on public.guides';
  create policy "Admins can read all guides" on public.guides for select using (public.is_admin());

  -- Exams
  execute 'drop policy if exists "Admins can insert exams" on public.exams';
  create policy "Admins can insert exams" on public.exams for insert with check (public.is_admin());
  execute 'drop policy if exists "Admins can update exams" on public.exams';
  create policy "Admins can update exams" on public.exams for update using (public.is_admin());
  execute 'drop policy if exists "Admins can delete exams" on public.exams';
  create policy "Admins can delete exams" on public.exams for delete using (public.is_admin());
  execute 'drop policy if exists "Admins can read all exam questions" on public.exam_questions';
  create policy "Admins can read all exam questions" on public.exam_questions for select using (public.is_admin());
  execute 'drop policy if exists "Admins can insert exam questions" on public.exam_questions';
  create policy "Admins can insert exam questions" on public.exam_questions for insert with check (public.is_admin());
  execute 'drop policy if exists "Admins can update exam questions" on public.exam_questions';
  create policy "Admins can update exam questions" on public.exam_questions for update using (public.is_admin());
  execute 'drop policy if exists "Admins can delete exam questions" on public.exam_questions';
  create policy "Admins can delete exam questions" on public.exam_questions for delete using (public.is_admin());
  execute 'drop policy if exists "Admins can read all exam registrations" on public.exam_registrations';
  create policy "Admins can read all exam registrations" on public.exam_registrations for select using (public.is_admin());
  execute 'drop policy if exists "Admins can read all exam attempts" on public.exam_attempts';
  create policy "Admins can read all exam attempts" on public.exam_attempts for select using (public.is_admin());
end $$;

-- 7. VIEWS
create or replace view public.exam_registration_counts as
  select exam_id, count(*) as registration_count
  from public.exam_registrations
  group by exam_id;

-- 8. SEED DATA
insert into public.aptitude_questions (id, category, question, options, correct, explanation) values
('a1','Spatial Reasoning','If an aircraft is heading North and makes a 90° right turn, what is its new heading?','["South","East","West","North-East"]',1,'A 90° right turn from North (360°) gives a heading of East (090°).'),
('a2','Spatial Reasoning','An aircraft heading 270° makes a 180° turn. What is the new heading?','["090°","180°","360°","045°"]',0,'270° + 180° = 450° - 360° = 090° (East).'),
('a3','Spatial Reasoning','If you are facing East and turn left 135°, which direction do you face?','["North-West","North-East","South-West","North"]',3,'East (090°) - 135° = 315° which is North-West.'),
('a4','Spatial Reasoning','A cube is painted red on all faces and cut into 27 equal smaller cubes. How many small cubes have exactly 2 red faces?','["8","12","6","1"]',1,'Edge cubes (not corners) have exactly 2 painted faces. A 3×3×3 cube has 12 edge positions.'),
('a5','Spatial Reasoning','Looking at an aircraft from behind, if the left wing dips, which way is the aircraft rolling?','["Rolling right","Rolling left","Pitching up","Yawing left"]',1,'If the left wing dips when viewed from behind, the aircraft is rolling to the left.')
on conflict (id) do nothing;

insert into public.rtr_tests (id, title, description, price, status) values
('rtr_t1','RTR(A) Mock Test — Set 1','Complete RTR(A) mock exam with Part 1 (written MCQ) and Part 2 (RT practical transmission).',299,'active'),
('rtr_t2','RTR(A) Mock Test — Set 2','Second set of RTR(A) mock exam. Practice with different question sets for thorough preparation.',299,'active')
on conflict (id) do nothing;

insert into public.guides (id, title, category, summary, content, read_time, difficulty, published) values
('g1','How to Become a Commercial Pilot in India','Career Path','Complete step-by-step guide from zero experience to your CPL, covering eligibility, training, exams, and job placement.','...content...', '12 min read','Beginner',true)
on conflict (id) do nothing;

insert into public.exams (id, title, subject, description, exam_date, exam_time, duration, total_questions, fee, status) values
('e1','All India Air Navigation Mock','Air Navigation','National level mock exam for Air Navigation.','2026-04-15','10:00',120,100,499,'Upcoming')
on conflict (id) do nothing;
