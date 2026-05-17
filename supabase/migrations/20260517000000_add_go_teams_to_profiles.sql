alter table public.profiles
  add column if not exists go_teams text[] not null default '{}';

create index if not exists profiles_go_teams_gin_idx
  on public.profiles
  using gin (go_teams);
