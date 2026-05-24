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

create table if not exists public.app_ratings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  feedback text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint app_ratings_user_unique unique (user_id)
);
