-- Control de puntos: esquema + RLS
-- Ejecutar en el SQL Editor de Supabase (o supabase db push)

create extension if not exists "pgcrypto";

do $$ begin
  create type public.user_role as enum ('admin', 'operator', 'driver');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.alerta_status as enum ('pending', 'arrived', 'cancelled');
exception when duplicate_object then null;
end $$;

create table if not exists public.busetas (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  placa text not null default '',
  active boolean not null default true
);

create table if not exists public.puntos (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text not null default '',
  active boolean not null default true
);

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null unique,
  password_hash text not null,
  role public.user_role not null,
  buseta_id uuid references public.busetas(id) on delete set null,
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.punto_operadores (
  punto_id uuid not null references public.puntos(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  primary key (punto_id, user_id)
);

create table if not exists public.recorridos (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  active boolean not null default true
);

create table if not exists public.recorrido_puntos (
  recorrido_id uuid not null references public.recorridos(id) on delete cascade,
  punto_id uuid not null references public.puntos(id) on delete restrict,
  orden int not null,
  tiempo_esperado_min int not null default 0,
  primary key (recorrido_id, punto_id)
);

create table if not exists public.horarios (
  id uuid primary key default gen_random_uuid(),
  recorrido_id uuid not null references public.recorridos(id) on delete cascade,
  buseta_id uuid not null references public.busetas(id) on delete restrict,
  conductor_id uuid not null references public.users(id) on delete restrict,
  hora_salida text not null,
  hora_llegada text not null,
  tiempo_viaje_min int not null default 0,
  dias int[] not null default '{}',
  active boolean not null default true
);

create table if not exists public.alertas_proximidad (
  id uuid primary key default gen_random_uuid(),
  punto_id uuid not null references public.puntos(id) on delete cascade,
  conductor_id uuid not null references public.users(id) on delete cascade,
  buseta_id uuid not null references public.busetas(id) on delete restrict,
  horario_id uuid references public.horarios(id) on delete set null,
  created_at timestamptz not null default now(),
  status public.alerta_status not null default 'pending'
);

create table if not exists public.registros_cruce (
  id uuid primary key default gen_random_uuid(),
  punto_id uuid not null references public.puntos(id) on delete cascade,
  conductor_id uuid not null references public.users(id) on delete restrict,
  buseta_id uuid not null references public.busetas(id) on delete restrict,
  horario_id uuid references public.horarios(id) on delete set null,
  alerta_id uuid references public.alertas_proximidad(id) on delete set null,
  hora_llegada_real timestamptz not null,
  hora_salida_real timestamptz,
  registrado_por uuid not null references public.users(id) on delete restrict,
  evidencia_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.notificaciones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  body text not null,
  read boolean not null default false,
  created_at timestamptz not null default now(),
  registro_id uuid references public.registros_cruce(id) on delete set null,
  punto_id uuid references public.puntos(id) on delete set null
);

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null
);

create index if not exists alertas_punto_status_idx
  on public.alertas_proximidad (punto_id, status, created_at desc);
create index if not exists registros_punto_llegada_idx
  on public.registros_cruce (punto_id, hora_llegada_real desc);
create index if not exists notificaciones_user_idx
  on public.notificaciones (user_id, created_at desc);

alter table public.busetas enable row level security;
alter table public.puntos enable row level security;
alter table public.users enable row level security;
alter table public.punto_operadores enable row level security;
alter table public.recorridos enable row level security;
alter table public.recorrido_puntos enable row level security;
alter table public.horarios enable row level security;
alter table public.alertas_proximidad enable row level security;
alter table public.registros_cruce enable row level security;
alter table public.notificaciones enable row level security;
alter table public.push_subscriptions enable row level security;

-- El cliente Next usa la service_role en el servidor (omite RLS).
-- Anon no lee ni escribe: la privacidad ("solo el bus anterior y el admin")
-- se aplica en las Server Actions. Realtime opcional queda cerrado.

revoke all on all tables in schema public from anon, authenticated;
grant usage on schema public to anon, authenticated;

-- Políticas explícitas de denegación para anon (defensa en profundidad)
drop policy if exists deny_anon_users on public.users;
create policy deny_anon_users on public.users for all to anon using (false) with check (false);

drop policy if exists deny_anon_registros on public.registros_cruce;
create policy deny_anon_registros on public.registros_cruce for all to anon using (false) with check (false);

drop policy if exists deny_anon_alertas on public.alertas_proximidad;
create policy deny_anon_alertas on public.alertas_proximidad for all to anon using (false) with check (false);

drop policy if exists deny_anon_notificaciones on public.notificaciones;
create policy deny_anon_notificaciones on public.notificaciones for all to anon using (false) with check (false);
