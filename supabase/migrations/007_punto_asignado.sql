-- Punto asignado a operador/admin + numeración de puntos de cruce
alter table public.users
  add column if not exists punto_id uuid references public.puntos(id) on delete set null;

alter table public.puntos
  add column if not exists numero integer;

-- Numeración inicial por orden de nombre si falta
with ranked as (
  select id, row_number() over (order by name) as n
  from public.puntos
  where deleted_at is null and numero is null
)
update public.puntos p
set numero = ranked.n
from ranked
where p.id = ranked.id;
