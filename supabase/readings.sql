create table if not exists public.readings (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  client_name text not null default '',
  question text not null default '',
  spread_preset text not null,
  positions text[] not null,
  cards jsonb not null,
  interpretation text not null default '',
  export_theme text check (export_theme in ('day', 'night'))
);

create index if not exists readings_user_created_idx on public.readings (user_id, created_at desc);

alter table public.readings enable row level security;

drop policy if exists readings_select_own on public.readings;
create policy readings_select_own on public.readings for select using (user_id = auth.uid());

drop policy if exists readings_insert_own on public.readings;
create policy readings_insert_own on public.readings for insert with check (user_id = auth.uid());

drop policy if exists readings_update_own on public.readings;
create policy readings_update_own on public.readings for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists readings_delete_own on public.readings;
create policy readings_delete_own on public.readings for delete using (user_id = auth.uid());

-- 八字：客人出生信息 { calendar, date, leapMonth, time, gender }，没填为 null。
alter table public.readings add column if not exists birth jsonb;
