-- Espera entre avisos de proximidad del mismo punto (segundos).
alter table public.app_settings
  add column if not exists aviso_cooldown_seconds int not null default 180;
