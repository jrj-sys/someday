-- journal entries. one per moment you want to remember, hung off a country and
-- optionally off a real place inside it
create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  -- matches countryId() from lib/data/world, same key the globe and profile use
  country_id text not null,
  -- from the place picker. null means the entry is about the country generally
  place_name text,
  place_lat double precision,
  place_lon double precision,
  -- the day it happened, which is often not the day you wrote it down
  happened_on date not null default current_date,
  body text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists journal_entries_user_country_idx
  on public.journal_entries (user_id, country_id, happened_on desc);

-- photos live in storage, this table is the index of what belongs to what.
-- user_id is duplicated from the entry on purpose so the storage policies can
-- check ownership without a join
create table if not exists public.journal_photos (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.journal_entries (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  -- path inside the memories bucket, always <user_id>/<entry_id>/<file>
  storage_path text not null,
  created_at timestamptz not null default now()
);

create index if not exists journal_photos_entry_idx on public.journal_photos (entry_id);

alter table public.journal_entries enable row level security;
alter table public.journal_photos enable row level security;

-- when friends arrive in v2, these select policies are the single place that
-- changes: "using (auth.uid() = user_id or is_friend(auth.uid(), user_id))"
create policy "read own entries" on public.journal_entries for select
  using (auth.uid() = user_id);
create policy "write own entries" on public.journal_entries for insert
  with check (auth.uid() = user_id);
create policy "update own entries" on public.journal_entries for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete own entries" on public.journal_entries for delete
  using (auth.uid() = user_id);

create policy "read own photos" on public.journal_photos for select
  using (auth.uid() = user_id);
create policy "write own photos" on public.journal_photos for insert
  with check (auth.uid() = user_id);
create policy "delete own photos" on public.journal_photos for delete
  using (auth.uid() = user_id);

-- private bucket. nothing in here is reachable by url alone, the app asks for a
-- short lived signed link and storage only hands one over if the policies below
-- say this person may read the file
insert into storage.buckets (id, name, public)
values ('memories', 'memories', false)
on conflict (id) do nothing;

-- every object is stored as <user_id>/<entry_id>/<file>, so the first folder
-- segment is the owner. that's what these policies check
create policy "read own memory photos" on storage.objects for select
  using (bucket_id = 'memories' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "upload own memory photos" on storage.objects for insert
  with check (bucket_id = 'memories' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "delete own memory photos" on storage.objects for delete
  using (bucket_id = 'memories' and (storage.foldername(name))[1] = auth.uid()::text);
