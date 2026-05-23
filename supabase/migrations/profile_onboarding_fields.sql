-- ============================================================
-- ADD ONBOARDING FIELDS TO PROFILES
-- phone (required at signup), city (optional), date_of_birth (required at signup)
-- Captured from auth.users.raw_user_meta_data on signup via trigger.
-- Safe to re-run.
-- ============================================================

alter table public.profiles
  add column if not exists phone          text,
  add column if not exists city           text,
  add column if not exists date_of_birth  date;

-- Recreate handle_new_user so it also persists the new onboarding fields
-- from raw_user_meta_data. Keeps the original behaviour of writing id + email
-- so anything depending on those columns continues to work.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  meta_full_name text := nullif(trim(coalesce(new.raw_user_meta_data->>'full_name', '')), '');
  meta_phone     text := nullif(trim(coalesce(new.raw_user_meta_data->>'phone', '')), '');
  meta_city      text := nullif(trim(coalesce(new.raw_user_meta_data->>'city', '')), '');
  meta_dob_text  text := nullif(trim(coalesce(new.raw_user_meta_data->>'date_of_birth', '')), '');
  meta_dob       date;
begin
  if meta_dob_text is not null then
    begin
      meta_dob := meta_dob_text::date;
    exception when others then
      meta_dob := null;
    end;
  end if;

  insert into public.profiles (id, email, full_name, phone, city, date_of_birth)
  values (new.id, new.email, meta_full_name, meta_phone, meta_city, meta_dob)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
