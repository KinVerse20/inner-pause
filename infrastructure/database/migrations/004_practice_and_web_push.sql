begin;

create table if not exists public.practice_enrollments (
  id uuid primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  issue_id text not null check (issue_id in ('anxiety', 'confidence', 'focus', 'reactivity', 'sleep')),
  reminder_time time not null,
  timezone text not null,
  reminder_enabled boolean not null default true,
  last_reminder_local_date date,
  status text not null default 'active' check (status in ('active', 'completed', 'paused')),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists one_active_practice_per_user
  on public.practice_enrollments(user_id) where status = 'active';

create table if not exists public.practice_checkins (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.practice_enrollments(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  day_number smallint not null check (day_number between 1 and 14),
  rating smallint not null check (rating between 1 and 5),
  note text not null default '',
  created_at timestamptz not null default now(),
  unique (enrollment_id, day_number)
);

create table if not exists public.practice_completions (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.practice_enrollments(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  day_number smallint not null check (day_number between 1 and 14),
  reflection text,
  completed_at timestamptz not null default now(),
  unique (enrollment_id, day_number)
);

create table if not exists public.web_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth_secret text not null,
  user_agent text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists practice_reminder_lookup
  on public.practice_enrollments(status, reminder_enabled, reminder_time);
create index if not exists practice_user_history
  on public.practice_enrollments(user_id, started_at desc);
create index if not exists web_push_user_lookup
  on public.web_push_subscriptions(user_id) where active = true;

commit;
