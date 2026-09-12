-- Optional description / notes on crossing records
alter table public.registros_cruce
  add column if not exists descripcion text;
