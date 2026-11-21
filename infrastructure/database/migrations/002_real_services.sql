create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  journal_entry_id uuid references public.journal_entries(id) on delete cascade,
  job_type text not null check (job_type in ('journal_analysis', 'reset_audio', 'notification')),
  status text not null check (status in ('queued', 'processing', 'completed', 'failed')),
  idempotency_key text,
  result_id uuid,
  error_message text,
  attempts integer not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index if not exists jobs_user_idempotency_idx
  on public.jobs(user_id, idempotency_key)
  where idempotency_key is not null;

create index if not exists jobs_status_type_idx on public.jobs(status, job_type, created_at);
create index if not exists jobs_user_created_idx on public.jobs(user_id, created_at desc);

create table if not exists public.audio_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  journal_entry_id uuid references public.journal_entries(id) on delete set null,
  title text not null,
  duration_seconds integer not null,
  object_key text not null unique,
  mime_type text,
  size_bytes integer,
  created_at timestamptz default now(),
  deleted_at timestamptz
);

create index if not exists audio_records_user_created_idx on public.audio_records(user_id, created_at desc);
create index if not exists audio_records_user_journal_idx on public.audio_records(user_id, journal_entry_id);

create table if not exists public.notification_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  idempotency_key text,
  message_text text not null,
  scheduled_for timestamptz,
  delivery_channel text not null default 'mock',
  delivery_status text not null default 'queued',
  provider_message_id text,
  error_message text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index if not exists notification_messages_user_idempotency_idx
  on public.notification_messages(user_id, idempotency_key)
  where idempotency_key is not null;

create index if not exists notification_messages_user_created_idx on public.notification_messages(user_id, created_at desc);
create index if not exists notification_messages_scheduled_idx on public.notification_messages(delivery_status, scheduled_for);

drop trigger if exists set_jobs_updated_at on public.jobs;
create trigger set_jobs_updated_at before update on public.jobs for each row execute function public.set_updated_at();
drop trigger if exists set_notification_messages_updated_at on public.notification_messages;
create trigger set_notification_messages_updated_at before update on public.notification_messages for each row execute function public.set_updated_at();

