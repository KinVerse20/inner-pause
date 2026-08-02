create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  phone text,
  avatar_url text,
  timezone text default 'UTC',
  onboarding_completed boolean default false,
  preferred_session_duration integer default 20,
  preferred_voice text default 'Soft guide',
  preferred_music_style text default 'Cosmic ambient',
  preferred_guidance_level text default 'Balanced',
  affirmations_enabled boolean default true,
  nature_sounds_enabled boolean default false,
  ai_memory_enabled boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  raw_text text,
  transcription text,
  save_mode text not null check (save_mode in ('journal_and_analysis', 'reset_only', 'journal_without_analysis', 'temporary_analysis')),
  is_temporary boolean default false,
  emotional_intensity_before integer check (emotional_intensity_before between 1 and 10),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.emotional_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  journal_entry_id uuid not null references public.journal_entries(id) on delete cascade,
  summary text not null,
  incidents_json jsonb not null default '[]',
  emotions_json jsonb not null default '[]',
  triggers_json jsonb not null default '[]',
  chakra_analysis_json jsonb not null default '[]',
  suggested_outcome text,
  recommended_duration integer,
  safety_flag boolean default false,
  model_version text,
  created_at timestamptz default now()
);

create table if not exists public.healing_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  journal_entry_id uuid references public.journal_entries(id) on delete set null,
  emotional_analysis_id uuid references public.emotional_analyses(id) on delete set null,
  title text not null,
  total_duration integer not null,
  intended_outcome text,
  session_manifest_json jsonb not null default '[]',
  status text not null default 'draft',
  created_at timestamptz default now(),
  started_at timestamptz,
  completed_at timestamptz,
  last_playback_position jsonb not null default '{"blockIndex":0,"elapsedSeconds":0}'
);

create table if not exists public.session_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  healing_session_id uuid not null references public.healing_sessions(id) on delete cascade,
  emotional_intensity_before integer check (emotional_intensity_before between 1 and 10),
  emotional_intensity_after integer check (emotional_intensity_after between 1 and 10),
  body_tension_before integer check (body_tension_before between 1 and 10),
  body_tension_after integer check (body_tension_after between 1 and 10),
  mental_calmness_after integer check (mental_calmness_after between 1 and 10),
  helpful_section text,
  notes text,
  would_repeat boolean,
  created_at timestamptz default now()
);

create table if not exists public.user_patterns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  pattern_type text not null,
  pattern_name text not null,
  evidence_json jsonb not null default '[]',
  confidence_score numeric not null default 0,
  occurrence_count integer not null default 1,
  first_detected_at timestamptz default now(),
  last_detected_at timestamptz default now()
);

create table if not exists public.morning_guidance (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_journal_entry_id uuid references public.journal_entries(id) on delete set null,
  message_text text not null,
  scheduled_for timestamptz,
  delivery_channel text not null default 'mock',
  delivery_status text not null default 'mock_created',
  created_at timestamptz default now()
);

create table if not exists public.audio_tracks (
  id text primary key,
  title text not null,
  chakra text,
  frequency integer,
  type text not null,
  duration integer not null,
  storage_url text not null,
  voice_style text,
  music_style text,
  is_premium boolean default false,
  active boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan text not null,
  status text not null,
  provider text not null,
  provider_subscription_id text,
  started_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists journal_entries_user_created_idx on public.journal_entries(user_id, created_at desc);
create index if not exists emotional_analyses_user_entry_idx on public.emotional_analyses(user_id, journal_entry_id);
create index if not exists healing_sessions_user_status_idx on public.healing_sessions(user_id, status);
create index if not exists session_feedback_user_session_idx on public.session_feedback(user_id, healing_session_id);
create index if not exists user_patterns_user_type_idx on public.user_patterns(user_id, pattern_type);
create index if not exists morning_guidance_user_scheduled_idx on public.morning_guidance(user_id, scheduled_for desc);
create index if not exists subscriptions_user_status_idx on public.subscriptions(user_id, status);

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
drop trigger if exists set_journal_entries_updated_at on public.journal_entries;
create trigger set_journal_entries_updated_at before update on public.journal_entries for each row execute function public.set_updated_at();
drop trigger if exists set_subscriptions_updated_at on public.subscriptions;
create trigger set_subscriptions_updated_at before update on public.subscriptions for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.journal_entries enable row level security;
alter table public.emotional_analyses enable row level security;
alter table public.healing_sessions enable row level security;
alter table public.session_feedback enable row level security;
alter table public.user_patterns enable row level security;
alter table public.morning_guidance enable row level security;
alter table public.subscriptions enable row level security;

create policy "Users manage own profile" on public.profiles for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "Users manage own journal entries" on public.journal_entries for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own analyses" on public.emotional_analyses for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own healing sessions" on public.healing_sessions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own feedback" on public.session_feedback for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own patterns" on public.user_patterns for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own guidance" on public.morning_guidance for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own subscriptions" on public.subscriptions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Active audio tracks are readable" on public.audio_tracks for select using (active = true);

insert into public.audio_tracks (id, title, chakra, frequency, type, duration, storage_url, music_style)
values
  ('root-grounding-396', 'Root grounding', 'root', 396, 'healing', 480, '/audio/root.mp3', 'placeholder'),
  ('sacral-flow-417', 'Sacral emotional flow', 'sacral', 417, 'healing', 480, '/audio/sacral.mp3', 'placeholder'),
  ('solar-confidence-528', 'Solar Plexus confidence', 'solar_plexus', 528, 'healing', 600, '/audio/solar-plexus.mp3', 'placeholder'),
  ('heart-release-639', 'Heart release', 'heart', 639, 'healing', 600, '/audio/heart.mp3', 'placeholder'),
  ('throat-expression-741', 'Throat expression', 'throat', 741, 'healing', 480, '/audio/throat.mp3', 'placeholder'),
  ('third-eye-clarity-852', 'Third Eye clarity', 'third_eye', 852, 'healing', 480, '/audio/third-eye.mp3', 'placeholder'),
  ('crown-connection-963', 'Crown connection', 'crown', 963, 'healing', 480, '/audio/crown.mp3', 'placeholder')
on conflict (id) do nothing;
