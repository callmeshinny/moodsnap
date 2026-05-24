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
