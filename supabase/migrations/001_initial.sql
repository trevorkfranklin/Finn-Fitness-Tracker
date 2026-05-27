-- Gridiron Gains — initial schema
-- Run this in your Supabase project's SQL Editor

create table if not exists profiles (
  id         uuid primary key,          -- client-generated, stored in localStorage as gg_player_id
  name       text        not null,
  total_xp   integer     not null default 0,
  current_streak        integer not null default 0,
  longest_streak        integer not null default 0,
  workouts_completed    integer not null default 0,
  total_personal_bests  integer not null default 0,
  last_workout_date     text,           -- YYYY-MM-DD
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists workout_logs (
  id           uuid primary key default gen_random_uuid(),
  profile_id   uuid not null references profiles(id) on delete cascade,
  date         text not null,           -- YYYY-MM-DD
  workout_type text,
  workout_name text,
  exercises    jsonb not null default '{}',
  xp_earned    integer not null default 0,
  completed    boolean not null default false,
  ai_generated boolean not null default false,
  new_pbs      jsonb not null default '[]',
  completed_at bigint,                  -- ms timestamp
  created_at   timestamptz not null default now(),
  unique (profile_id, date)
);

create table if not exists personal_bests (
  id               uuid primary key default gen_random_uuid(),
  profile_id       uuid not null references profiles(id) on delete cascade,
  exercise_id      text not null,
  max_weight       numeric,
  max_reps         integer,
  max_weight_date  text,
  max_reps_date    text,
  updated_at       timestamptz not null default now(),
  unique (profile_id, exercise_id)
);

create table if not exists unlocked_achievements (
  id             uuid primary key default gen_random_uuid(),
  profile_id     uuid not null references profiles(id) on delete cascade,
  achievement_id text not null,
  unlocked_at    timestamptz not null default now(),
  unique (profile_id, achievement_id)
);

-- Keep updated_at current on profiles
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on profiles
  for each row execute procedure set_updated_at();
