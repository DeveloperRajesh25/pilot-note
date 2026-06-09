-- ============================================================
-- DGCA PRACTICE RESULTS
-- Records each completed practice session so results appear in
-- the user's profile. One row per finished session.
-- ============================================================

create table if not exists public.dgca_practice_results (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  chapter_id   text not null references public.dgca_chapters(id) on delete cascade,
  score        int  not null,   -- obtained marks
  total        int  not null,   -- total marks available
  answers      jsonb not null,  -- array: user's selected option index, or null per question
  completed_at timestamptz default now()
);

alter table public.dgca_practice_results enable row level security;

create index if not exists dgca_practice_results_user_idx
  on public.dgca_practice_results(user_id, completed_at desc);

do $$
begin
  execute 'drop policy if exists "Users view own practice results" on public.dgca_practice_results';
  create policy "Users view own practice results"
    on public.dgca_practice_results for select
    using (auth.uid() = user_id);

  execute 'drop policy if exists "Users insert own practice results" on public.dgca_practice_results';
  create policy "Users insert own practice results"
    on public.dgca_practice_results for insert
    with check (auth.uid() = user_id);

  execute 'drop policy if exists "Admins read all practice results" on public.dgca_practice_results';
  create policy "Admins read all practice results"
    on public.dgca_practice_results for select
    using (public.is_admin());
end $$;
