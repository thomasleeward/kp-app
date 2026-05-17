alter table public.profiles
  add column if not exists tags text[] not null default '{}';

create index if not exists profiles_tags_gin_idx
  on public.profiles
  using gin (tags);
