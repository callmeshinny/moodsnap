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
