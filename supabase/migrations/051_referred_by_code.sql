alter table public.user_profiles
  add column if not exists referred_by_code text default null;
