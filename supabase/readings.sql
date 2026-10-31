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

-- 表结构不变，以下两个约定由前端处理：
-- 删除：没有 delete 权限，删除时把记录清空并设 spread_preset = 'deleted'，拉取时跳过。
-- 八字：cards 前三项是三张牌，填了出生信息时第四项为 { "birth": {...} }。
