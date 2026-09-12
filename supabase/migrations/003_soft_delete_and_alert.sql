-- Soft deletes + cache bust for alert sound + per-operator alert settings

alter table public.users add column if not exists deleted_at timestamptz;
alter table public.busetas add column if not exists deleted_at timestamptz;
alter table public.puntos add column if not exists deleted_at timestamptz;
alter table public.recorridos add column if not exists deleted_at timestamptz;
alter table public.horarios add column if not exists deleted_at timestamptz;

alter table public.app_settings
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.operator_alert_settings (
  user_id uuid primary key references public.users(id) on delete cascade,
  alert_sound_url text not null default '/sounds/alerta.wav',
  alert_sound_data text,
  alert_sound_mime text,
  alert_sound_name text,
  updated_at timestamptz not null default now()
);

alter table public.operator_alert_settings enable row level security;

drop policy if exists deny_anon_operator_alert on public.operator_alert_settings;
create policy deny_anon_operator_alert on public.operator_alert_settings
  for all to anon using (false) with check (false);
