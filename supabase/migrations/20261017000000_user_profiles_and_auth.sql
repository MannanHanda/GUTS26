-- =============================================================================
-- Uniwise (GUTS26) — Supabase Schema for Auth, User Profiles, Saved Plans & Activity Logs
-- Run this SQL in your Supabase Cloud SQL Editor (or via `supabase db push`).
-- =============================================================================

-- 1. User Profiles table (1-to-1 with auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  university text not null default 'University of Glasgow',
  student_category text check (student_category in ('scottish', 'rest_of_uk', 'international')),
  age_band text check (age_band in ('under_22', '22_or_over')),
  move_in_date date,
  course_name text,
  year_of_study integer check (year_of_study is null or (year_of_study >= 1 and year_of_study <= 8)),
  phone text,
  -- Stores the StudentProfile JSON (budget, rent cap, transport & banking preferences)
  student_profile jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Saved / Shortlisted Plans table (accommodation + commute setups)
create table if not exists public.saved_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  candidate_id text not null,
  residence_name text not null,
  room_type text not null,
  transport_mode text not null,
  monthly_total_gbp numeric,
  upfront_total_gbp numeric,
  commute_duration_min numeric,
  overall_score numeric,
  notes text,
  created_at timestamptz not null default now(),
  unique (user_id, candidate_id)
);

-- 3. User Activity Logs table (tracks registration, login, profile updates, saved plans)
create table if not exists public.user_activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  description text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_saved_plans_user_id on public.saved_plans(user_id, created_at desc);
create index if not exists idx_user_activity_logs_user_id on public.user_activity_logs(user_id, created_at desc);

-- =============================================================================
-- Row Level Security (RLS)
-- =============================================================================
alter table public.profiles enable row level security;
alter table public.saved_plans enable row level security;
alter table public.user_activity_logs enable row level security;

-- Profiles policies
drop policy if exists "Users can view their own profile" on public.profiles;
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Saved plans policies
drop policy if exists "Users can view their own saved plans" on public.saved_plans;
create policy "Users can view their own saved plans"
  on public.saved_plans for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own saved plans" on public.saved_plans;
create policy "Users can insert their own saved plans"
  on public.saved_plans for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own saved plans" on public.saved_plans;
create policy "Users can update their own saved plans"
  on public.saved_plans for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own saved plans" on public.saved_plans;
create policy "Users can delete their own saved plans"
  on public.saved_plans for delete
  using (auth.uid() = user_id);

-- Activity logs policies
drop policy if exists "Users can view their own activity logs" on public.user_activity_logs;
create policy "Users can view their own activity logs"
  on public.user_activity_logs for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own activity logs" on public.user_activity_logs;
create policy "Users can insert their own activity logs"
  on public.user_activity_logs for insert
  with check (auth.uid() = user_id);

-- =============================================================================
-- Triggers for automatic profile creation and updated_at timestamp
-- =============================================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    email,
    full_name,
    university,
    student_category,
    age_band,
    course_name
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'university', 'University of Glasgow'),
    case
      when new.raw_user_meta_data->>'student_category' in ('scottish', 'rest_of_uk', 'international')
        then new.raw_user_meta_data->>'student_category'
      else null
    end,
    case
      when new.raw_user_meta_data->>'age_band' in ('under_22', '22_or_over')
        then new.raw_user_meta_data->>'age_band'
      else null
    end,
    new.raw_user_meta_data->>'course_name'
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(nullif(excluded.full_name, ''), public.profiles.full_name),
    updated_at = now();

  insert into public.user_activity_logs (user_id, action, description, metadata)
  values (
    new.id,
    'registered',
    'Created Uniwise student account',
    jsonb_build_object('email', new.email)
  );

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
