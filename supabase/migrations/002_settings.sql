-- Configuración de la app (fila única id=1)
create table if not exists public.app_settings (
  id int primary key default 1 check (id = 1),
  alert_sound_url text not null default '/sounds/alerta.wav',
  alert_sound_data text,
  alert_sound_mime text,
  alert_sound_name text
);

alter table public.app_settings enable row level security;

insert into public.app_settings (id, alert_sound_url)
values (1, '/sounds/alerta.wav')
on conflict (id) do nothing;

drop policy if exists deny_anon_settings on public.app_settings;
create policy deny_anon_settings on public.app_settings
  for all to anon using (false) with check (false);
