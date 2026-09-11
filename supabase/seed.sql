-- Seed demo.
-- Admin: celular 3144200204 / Contraseña1@
-- Resto: celular 3000000001–03 / demo1234

insert into public.busetas (id, codigo, placa, active) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', '12', '', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', '07', '', true)
on conflict (id) do nothing;

insert into public.puntos (id, name, address, active) values
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 'El Recreo', 'Cruce del negocio — control principal', true),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', 'Puente El Espino', 'Segundo control del recorrido', true)
on conflict (id) do nothing;

insert into public.users (id, name, phone, password_hash, role, buseta_id, approved) values
  ('11111111-1111-1111-1111-111111111111', 'Administrador', '3144200204', '$2b$10$dKjNHsVYgN.9uoWPCTNdWebbgjt8k1wtXPPQzJvgQgWcemDZb3XnK', 'admin', null, true),
  ('22222222-2222-2222-2222-222222222222', 'Marta López', '3000000001', '$2b$10$FpGoGh8IcK6mzswbcpO3QO84oiTsUB2q6JVqRM7o.Heb7VGht3f7u', 'operator', null, true),
  ('33333333-3333-3333-3333-333333333333', 'Carlos Méndez', '3000000002', '$2b$10$FpGoGh8IcK6mzswbcpO3QO84oiTsUB2q6JVqRM7o.Heb7VGht3f7u', 'driver', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', true),
  ('44444444-4444-4444-4444-444444444444', 'Ana Ruiz', '3000000003', '$2b$10$FpGoGh8IcK6mzswbcpO3QO84oiTsUB2q6JVqRM7o.Heb7VGht3f7u', 'driver', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', true)
on conflict (id) do nothing;

insert into public.punto_operadores (punto_id, user_id) values
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', '22222222-2222-2222-2222-222222222222'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', '22222222-2222-2222-2222-222222222222')
on conflict do nothing;

insert into public.recorridos (id, name, active) values
  ('cccccccc-cccc-cccc-cccc-ccccccccccc1', 'Ruta Sur', true)
on conflict (id) do nothing;

insert into public.recorrido_puntos (recorrido_id, punto_id, orden, tiempo_esperado_min) values
  ('cccccccc-cccc-cccc-cccc-ccccccccccc1', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 1, 40),
  ('cccccccc-cccc-cccc-cccc-ccccccccccc1', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', 2, 25)
on conflict do nothing;

insert into public.horarios (id, recorrido_id, buseta_id, conductor_id, hora_salida, hora_llegada, tiempo_viaje_min, dias, active) values
  ('dddddddd-dddd-dddd-dddd-ddddddddddd1', 'cccccccc-cccc-cccc-cccc-ccccccccccc1', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', '33333333-3333-3333-3333-333333333333', '05:30', '07:10', 100, '{1,2,3,4,5,6}', true),
  ('dddddddd-dddd-dddd-dddd-ddddddddddd2', 'cccccccc-cccc-cccc-cccc-ccccccccccc1', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', '44444444-4444-4444-4444-444444444444', '05:45', '07:25', 100, '{1,2,3,4,5,6}', true)
on conflict (id) do nothing;
