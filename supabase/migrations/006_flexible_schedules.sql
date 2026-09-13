-- Driver optional departure for today + flexible schedule fields
alter table public.users
  add column if not exists salida_hoy text;

alter table public.users
  add column if not exists salida_hoy_fecha text;

alter table public.horarios
  alter column buseta_id drop not null;

alter table public.horarios
  alter column conductor_id drop not null;

update public.app_roles
set permissions = array[
  'manage.dashboard','manage.puntos','manage.recorridos','manage.busetas',
  'manage.personas','manage.horarios','manage.historial','manage.config','manage.roles',
  'operador.panel','operador.sonido'
]
where slug = 'admin';
