-- one profile row per signed in person. the columns mirror the Profile type in
-- lib/profile/types.ts, which is still the source of truth for the shape
create table if not exists public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  activities text[] not null default '{}',
  climate text not null default 'any',
  budget text not null default 'comfortable',
  visited text[] not null default '{}',
  dreams text[] not null default '{}',
  updated_at timestamptz not null default now()
);

-- row level security is the whole reason the anon key can be public. without
-- these policies anyone holding the key could read every profile in the table
alter table public.profiles enable row level security;

create policy "people can read their own profile" on public.profiles for select
  using (auth.uid() = user_id);

create policy "people can create their own profile" on public.profiles for insert
  with check (auth.uid() = user_id);

create policy "people can update their own profile" on public.profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "people can delete their own profile" on public.profiles for delete
  using (auth.uid() = user_id);
