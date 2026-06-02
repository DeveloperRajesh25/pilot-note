-- Site settings table for editable content (marquee, etc.)
create table if not exists public.site_settings (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz default now()
);

-- Default marquee items
insert into public.site_settings (key, value) values (
  'marquee_items',
  '["DGCA CPL & ATPL", "Air Navigation", "Meteorology", "Aviation Met", "Air Regulations", "Technical General", "COMPASS Aptitude", "Class 1 Medical", "Pariksha National Mocks", "Phraseology"]'::jsonb
) on conflict (key) do nothing;

alter table public.site_settings enable row level security;

-- Anyone can read settings
create policy "Public read site_settings" on public.site_settings
  for select using (true);

-- Only admins can write
create policy "Admins write site_settings" on public.site_settings
  for all using (public.is_admin());
