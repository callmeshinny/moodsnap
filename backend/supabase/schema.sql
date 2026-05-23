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

create unique index if not exists blocked_users_unique_pair_idx
  on public.blocked_users (blocker_id, blocked_user_id);

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

create unique index if not exists users_username_normalized_unique_idx
  on public.users (username_normalized);
create unique index if not exists users_username_lower_unique_idx
  on public.users (lower(username));
create index if not exists users_email_idx on public.users (email);
create index if not exists pending_registrations_email_idx on public.pending_registrations (email);
create index if not exists pending_registrations_username_idx on public.pending_registrations (username_normalized);
create index if not exists password_reset_otps_email_used_idx on public.password_reset_otps (email, is_used);
create index if not exists friendships_status_idx on public.friendships (status);
create index if not exists friendships_user_one_idx on public.friendships (user_one_id);
create index if not exists friendships_user_two_idx on public.friendships (user_two_id);
create index if not exists blocked_users_blocker_idx on public.blocked_users (blocker_id);
create index if not exists blocked_users_blocked_idx on public.blocked_users (blocked_user_id);
create index if not exists user_reports_reported_idx on public.user_reports (reported_user_id);
create index if not exists moodsnap_user_id_idx on public.moodsnap (user_id);
create index if not exists moodsnap_created_at_idx on public.moodsnap (created_at desc);
