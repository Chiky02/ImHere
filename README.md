# Control de puntos

Sistema web para que los conductores avisen que se acercan a un **punto de control**, el encargado reciba un **sonido**, registre llegada y salida, y **solo el bus anterior en ese punto** reciba la hora del que acaba de cruzar. El admin ve el historial completo. Sirve para **varios puntos** en un recorrido.

## Cuentas seed (local / seed.sql)

| Rol | Celular | Contraseña |
| --- | --- | --- |
| Admin | 3144200204 | Contraseña1@ |
| Operador | 3000000001 | demo1234 |
| Conductor | 3000000002 | demo1234 |
| Conductor | 3000000003 | demo1234 |

La buseta **no** se elige al registrarse: el admin la asigna al aprobar o desde Personas.

## Cómo probar el flujo

1. Operador: entra, pulsa **Activar sonido**, deja la pestaña abierta.
2. Carlos: **Estoy próximo a llegar** en El Recreo.
3. El panel del operador suena; **Registrar llegada** y luego **Registrar salida**.
4. Ana hace lo mismo en El Recreo.
5. Al registrar a Ana, **Carlos** recibe “El siguiente bus ya cruzó” (in-app y push si lo activó). Ana no ve el listado global.

## Desarrollo local

```bash
cd control-puntos
cp .env.example .env.local   # o usa el .env.local ya generado
npm install
npm run dev
```

Sin Supabase, los datos viven en `data/db.json` (se crea solo con el seed).

## Supabase + Vercel (producción)

Vercel no mantiene un archivo JSON entre instancias. En producción:

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. SQL Editor: ejecuta `supabase/migrations/001_init.sql` y `supabase/seed.sql`.
3. Variables en Vercel:

```
SESSION_SECRET=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:tu@correo
```

Las claves VAPID: `npx web-push generate-vapid-keys`.

4. Deploy:

```bash
npx vercel --prod
```

El servidor usa la **service role** (omite RLS). El anon key no lee tablas: la regla “solo el bus anterior + admin” está en las Server Actions. El SQL deja RLS activo como defensa.

## Arquitectura

- Next.js (App Router) en Vercel
- Auth propia (celular + contraseña, JWT en cookie, roles admin / operator / driver)
- Persistencia: JSON local **o** Postgres de Supabase si hay `SUPABASE_SERVICE_ROLE_KEY`
- Panel del punto: polling 1.5 s + audio de alerta (archivo o URL)
- Conductor: PWA + Web Push

### Sonido de alerta (panel operador)

1. Activa el sonido una vez en el panel (requisito del navegador).
2. Por defecto suena `public/sounds/alerta.wav` (sirena ~8 s) **en bucle** hasta silenciar o registrar llegada.
3. Para tu propia canción/alarma:
   - Copia el archivo a `public/sounds/alerta.mp3` (o `.ogg`), **o**
   - Define `NEXT_PUBLIC_ALERT_SOUND_URL=/sounds/alerta.mp3` o una URL `https://...`

Fotos: el registro de cruce ya tiene `evidencia_url` para más adelante.
