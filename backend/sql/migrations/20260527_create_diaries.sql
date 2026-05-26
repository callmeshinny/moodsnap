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

create index if not exists diaries_user_entry_date_idx
  on public.diaries (user_id, entry_date desc);

create index if not exists diaries_entry_date_created_idx
  on public.diaries (entry_date desc, created_at desc);
