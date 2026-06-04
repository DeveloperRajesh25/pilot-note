-- Contact form submissions
-- Run in Supabase SQL Editor before deploying the contact form.

create table if not exists public.contact_submissions (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text not null,
  topic      text not null,
  message    text not null,
  created_at timestamptz default now()
);

alter table public.contact_submissions enable row level security;

-- Only service-role (server actions) can insert; admins can read.
create policy "Service role inserts contact submissions"
  on public.contact_submissions for insert
  with check (true);

create policy "Admins read contact submissions"
  on public.contact_submissions for select
  using (public.is_admin());
