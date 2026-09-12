-- Roles con permisos + usuarios activos

create table if not exists public.app_roles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  home public.user_role not null,
  permissions text[] not null default '{}',
  is_system boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.app_roles enable row level security;
drop policy if exists deny_anon_roles on public.app_roles;
create policy deny_anon_roles on public.app_roles
  for all to anon using (false) with check (false);

alter table public.users
  add column if not exists active boolean not null default true;

alter table public.users
  add column if not exists role_id uuid references public.app_roles(id) on delete set null;

-- Roles de sistema
insert into public.app_roles (id, name, slug, home, permissions, is_system)
values
  (
    '00000000-0000-4000-8000-000000000001',
    'Administrador',
    'admin',
    'admin',
    array[
      'manage.dashboard','manage.puntos','manage.recorridos','manage.busetas',
      'manage.personas','manage.horarios','manage.historial','manage.config','manage.roles'
    ],
    true
  ),
  (
    '00000000-0000-4000-8000-000000000002',
    'Operador de punto',
    'operator',
    'operator',
    array['operador.panel','operador.sonido'],
    true
  ),
  (
    '00000000-0000-4000-8000-000000000003',
    'Conductor',
    'driver',
    'driver',
    array['conductor.avisar','conductor.buseta_self'],
    true
  )
on conflict (id) do update set
  permissions = excluded.permissions,
  name = excluded.name,
  home = excluded.home,
  is_system = true;

update public.users set role_id = '00000000-0000-4000-8000-000000000001' where role = 'admin' and role_id is null;
update public.users set role_id = '00000000-0000-4000-8000-000000000002' where role = 'operator' and role_id is null;
update public.users set role_id = '00000000-0000-4000-8000-000000000003' where role = 'driver' and role_id is null;
