create table if not exists public.notification_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  expo_push_token text not null unique,
  platform text,
  device_id text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.notification_tokens add column if not exists platform text;
alter table public.notification_tokens add column if not exists device_id text;
alter table public.notification_tokens add column if not exists is_active boolean not null default true;
alter table public.notification_tokens add column if not exists updated_at timestamptz not null default now();

create table if not exists public.notification_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade unique,
  new_snap_enabled boolean not null default true,
  reminders_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.notification_preferences add column if not exists new_snap_enabled boolean not null default true;
alter table public.notification_preferences add column if not exists reminders_enabled boolean not null default true;
alter table public.notification_preferences add column if not exists updated_at timestamptz not null default now();

create table if not exists public.notification_reminder_state (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade unique,
  last_snap_at timestamptz,
  sent_3h boolean not null default false,
  sent_12h boolean not null default false,
  sent_1d boolean not null default false,
  sent_2d boolean not null default false,
  sent_3d boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.notification_reminder_state add column if not exists last_snap_at timestamptz;
alter table public.notification_reminder_state add column if not exists sent_3h boolean not null default false;
alter table public.notification_reminder_state add column if not exists sent_12h boolean not null default false;
alter table public.notification_reminder_state add column if not exists sent_1d boolean not null default false;
alter table public.notification_reminder_state add column if not exists sent_2d boolean not null default false;
alter table public.notification_reminder_state add column if not exists sent_3d boolean not null default false;
alter table public.notification_reminder_state add column if not exists updated_at timestamptz not null default now();
