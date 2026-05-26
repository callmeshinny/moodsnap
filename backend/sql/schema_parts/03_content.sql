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
