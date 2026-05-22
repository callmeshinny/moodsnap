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
  created_at timestamptz not null default now()
);

create index if not exists users_email_idx on public.users (email);
create index if not exists otps_email_is_used_idx on public.otps (email, is_used);
create index if not exists moodsnap_created_at_idx on public.moodsnap (created_at desc);
create index if not exists moodsnap_user_id_idx on public.moodsnap (user_id);

insert into public.users (
  username,
  email,
  password_hash,
  is_verified,
  updated_at
) values (
  'Ngoc',
  'nngoc@gmail.com',
  '$2b$10$1MjJxIpavOr5LHC1elVQ8uYSFAPxDG6ldf4YhGi4XbQhXj8ry.zaG',
  true,
  now()
) on conflict (email) do update set
  username = excluded.username,
  password_hash = excluded.password_hash,
  is_verified = true,
  updated_at = now();
