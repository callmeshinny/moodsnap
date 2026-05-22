create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  username text not null,
  email text not null unique,
  password_hash text not null,
  avatar_url text,
  timezone text default 'Asia/Ho_Chi_Minh',
  calendar_mode text default 'month',
  is_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.otps (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  otp_code text not null,
  expires_at timestamptz not null,
  is_used boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.moodsnap (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  mood text not null,
  caption text,
  image_url text not null,
  image_public_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.moodsnap
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  user_one_id text not null,
  user_two_id text not null,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'rejected')),
  requested_by text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint friendships_no_self_check check (user_one_id <> user_two_id),
  constraint friendships_unique_pair unique (user_one_id, user_two_id)
);

create index if not exists users_email_idx on public.users (email);
create unique index if not exists users_username_unique_idx on public.users (username);
create index if not exists otps_email_is_used_idx on public.otps (email, is_used);
create index if not exists moodsnap_created_at_idx on public.moodsnap (created_at desc);
create index if not exists moodsnap_user_id_idx on public.moodsnap (user_id);
create index if not exists friendships_status_idx on public.friendships (status);
create index if not exists friendships_user_one_idx on public.friendships (user_one_id);
create index if not exists friendships_user_two_idx on public.friendships (user_two_id);
