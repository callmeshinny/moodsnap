create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  username text not null,
  username_normalized text not null,
  display_name text,
  email text not null unique,
  password_hash text not null,
  avatar_url text,
  avatar_public_id text,
  profile_color text default '#F65078',
  timezone text default 'Asia/Ho_Chi_Minh',
  calendar_mode text default 'month',
  is_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.users add column if not exists username_normalized text;
alter table public.users add column if not exists display_name text;
alter table public.users add column if not exists avatar_public_id text;
alter table public.users add column if not exists profile_color text default '#F65078';

update public.users
set username_normalized = lower(trim(username))
where username_normalized is null;

alter table public.users alter column username_normalized set not null;

create table if not exists public.pending_registrations (
  id uuid primary key default gen_random_uuid(),
  username text not null,
  username_normalized text not null,
  display_name text,
  email text not null unique,
  password_hash text not null,
  otp_hash text not null,
  expires_at timestamptz not null,
  attempt_count integer not null default 0,
  otp_request_count integer not null default 1,
  otp_request_window_start timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.pending_registrations add column if not exists username_normalized text;
alter table public.pending_registrations add column if not exists display_name text;
alter table public.pending_registrations add column if not exists otp_request_count integer not null default 1;
alter table public.pending_registrations add column if not exists otp_request_window_start timestamptz not null default now();
update public.pending_registrations
set username_normalized = lower(trim(username))
where username_normalized is null;
create unique index if not exists pending_registrations_email_unique_idx
  on public.pending_registrations (email);

create table if not exists public.password_reset_otps (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  otp_hash text not null,
  expires_at timestamptz not null,
  attempt_count integer not null default 0,
  otp_request_count integer not null default 1,
  otp_request_window_start timestamptz not null default now(),
  is_used boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.password_reset_otps add column if not exists otp_request_count integer not null default 1;
alter table public.password_reset_otps add column if not exists otp_request_window_start timestamptz not null default now();
alter table public.password_reset_otps add column if not exists updated_at timestamptz not null default now();

create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  user_one_id uuid not null references public.users(id) on delete cascade,
  user_two_id uuid not null references public.users(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'rejected')),
  requested_by uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint friendships_no_self_check check (user_one_id <> user_two_id),
  constraint friendships_unique_pair unique (user_one_id, user_two_id)
);

create table if not exists public.blocked_users (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid not null references public.users(id) on delete cascade,
  blocked_user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint blocked_users_no_self_check check (blocker_id <> blocked_user_id),
  constraint blocked_users_unique_pair unique (blocker_id, blocked_user_id)
);

alter table public.blocked_users add column if not exists blocked_user_id uuid;
alter table public.blocked_users add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'blocked_users'
      and column_name = 'blocked_id'
  ) then
    execute 'alter table public.blocked_users alter column blocked_id drop not null';
    execute 'update public.blocked_users set blocked_user_id = blocked_id where blocked_user_id is null';
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'blocked_users_unique_pair'
      and conrelid = 'public.blocked_users'::regclass
  ) then
    execute 'alter table public.blocked_users add constraint blocked_users_unique_pair unique (blocker_id, blocked_user_id)';
  end if;
end $$;

drop index if exists public.blocked_users_unique_pair_idx;

create table if not exists public.user_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.users(id) on delete cascade,
  reported_user_id uuid not null references public.users(id) on delete cascade,
  reason text,
  details text,
  created_at timestamptz not null default now()
);

create table if not exists public.moodsnap (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  mood text not null,
  caption text,
  image_url text not null,
  image_public_id text not null,
  cloudinary_public_id text,
  soft_filter_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.moodsnap add column if not exists cloudinary_public_id text;
alter table public.moodsnap add column if not exists soft_filter_enabled boolean not null default false;
alter table public.moodsnap add column if not exists updated_at timestamptz not null default now();

create table if not exists public.diaries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  entry_date date not null,
  title text not null,
  content text not null,
  mood text default 'normal',
  cover_image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint diaries_user_entry_date_unique unique (user_id, entry_date)
);

-- Diary entries are stored here. Each user can have one diary per local day.
-- The feed and profile views can query this table directly by user_id, entry_date, or created_at.

alter table public.diaries add column if not exists mood text default 'normal';
alter table public.diaries add column if not exists cover_image_url text;
alter table public.diaries add column if not exists updated_at timestamptz not null default now();

create table if not exists public.app_ratings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  feedback text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint app_ratings_user_unique unique (user_id)
);

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

create unique index if not exists users_username_normalized_unique_idx
  on public.users (username_normalized);

drop index if exists public.users_username_lower_unique_idx;
drop index if exists public.users_email_idx;

create index if not exists pending_registrations_username_idx on public.pending_registrations (username_normalized);
drop index if exists public.pending_registrations_email_idx;

create index if not exists password_reset_otps_email_used_created_at_idx
  on public.password_reset_otps (email, is_used, created_at desc);
drop index if exists public.password_reset_otps_email_used_idx;

create index if not exists friendships_user_one_status_created_idx
  on public.friendships (user_one_id, status, created_at desc);
create index if not exists friendships_user_two_status_created_idx
  on public.friendships (user_two_id, status, created_at desc);
drop index if exists public.friendships_status_idx;
drop index if exists public.friendships_user_one_idx;
drop index if exists public.friendships_user_two_idx;

drop index if exists public.blocked_users_blocker_idx;
create index if not exists blocked_users_blocked_idx on public.blocked_users (blocked_user_id);
create index if not exists user_reports_reported_idx on public.user_reports (reported_user_id);

create index if not exists moodsnap_user_created_at_idx
  on public.moodsnap (user_id, created_at desc);
drop index if exists public.moodsnap_user_id_idx;
drop index if exists public.moodsnap_created_at_idx;

create index if not exists diaries_user_entry_date_idx
  on public.diaries (user_id, entry_date desc);
create index if not exists diaries_entry_date_created_idx
  on public.diaries (entry_date desc, created_at desc);
create index if not exists diaries_user_entry_date_created_idx
  on public.diaries (user_id, entry_date desc, created_at desc);

drop index if exists public.app_ratings_user_id_idx;
drop index if exists public.app_ratings_rating_idx;

create index if not exists notification_tokens_active_user_token_idx
  on public.notification_tokens (user_id, expo_push_token)
  where is_active = true;
drop index if exists public.notification_tokens_user_id_idx;
drop index if exists public.notification_tokens_active_idx;

drop index if exists public.notification_preferences_user_id_idx;
drop index if exists public.notification_reminder_state_user_id_idx;
drop index if exists public.notification_reminder_state_last_snap_at_idx;
