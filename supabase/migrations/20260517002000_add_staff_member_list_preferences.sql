create table if not exists public.staff_member_list_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  sort_by text not null default 'name' check (sort_by in ('name', 'added_desc', 'added_asc')),
  team_filter text not null default '__all__',
  tag_filter text not null default '__all__',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.staff_member_list_preferences enable row level security;

create policy "Admins can read their own member list preferences"
  on public.staff_member_list_preferences
  for select
  using (
    user_id = auth.uid()
    and exists (
      select 1
      from public.staff_roles
      where staff_roles.user_id = auth.uid()
        and staff_roles.role = 'admin'
    )
  );

create policy "Admins can insert their own member list preferences"
  on public.staff_member_list_preferences
  for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.staff_roles
      where staff_roles.user_id = auth.uid()
        and staff_roles.role = 'admin'
    )
  );

create policy "Admins can update their own member list preferences"
  on public.staff_member_list_preferences
  for update
  using (
    user_id = auth.uid()
    and exists (
      select 1
      from public.staff_roles
      where staff_roles.user_id = auth.uid()
        and staff_roles.role = 'admin'
    )
  )
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.staff_roles
      where staff_roles.user_id = auth.uid()
        and staff_roles.role = 'admin'
    )
  );
