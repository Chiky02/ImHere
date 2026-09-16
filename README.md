# Checkpoint control

Web system so drivers can announce they are approaching a **checkpoint**, the attendant gets a **sound alert**, records arrival and departure, and **only the previous bus at that checkpoint** gets the time of the bus that just crossed. The admin sees the full history. It supports **multiple checkpoints** on a route.

## Seed accounts (local / seed.sql)

| Role | Phone | Password |
| --- | --- | --- |
| Admin | 3144200204 | Contraseña1@ |
| Operator | 3000000001 | demo1234 |
| Driver | 3000000002 | demo1234 |
| Driver | 3000000003 | demo1234 |

The bus is **not** chosen at signup: the admin assigns it when approving or from People.

## How to test the flow

1. Operator: sign in, press **Enable sound**, leave the tab open.
2. Carlos: **I'm about to arrive** at El Recreo.
3. The operator panel plays a sound; **Record arrival**, then **Record departure**.
4. Ana does the same at El Recreo.
5. When Ana is recorded, **Carlos** gets “The next bus already crossed”.

## Local development

```bash
cd control-puntos
cp .env.example .env.local
npm install
npm run dev
```

Without Supabase, data lives in `data/db.json` (created automatically with the seed).

## Alert sound

Configured in the app: **Admin → Config** (`/admin/configuracion`).

- Upload an MP3/WAV/OGG (max 3 MB), or
- Paste a URL `/sounds/...` or `https://...`
- Default: siren at `public/sounds/alerta.wav`

## Deploy to production (Supabase + GitHub + Vercel)

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. In **SQL Editor**, run in order:
   - `supabase/migrations/001_init.sql`
   - `supabase/migrations/002_settings.sql`
   - `supabase/migrations/003_soft_delete_and_alert.sql`
   - `supabase/migrations/004_registro_descripcion.sql`
   - `supabase/migrations/005_roles_permissions.sql`
   - `supabase/migrations/006_flexible_schedules.sql` — salida del conductor, horarios flexibles, admin con panel operador
   - `supabase/migrations/007_punto_asignado.sql` — punto asignado a operador/admin + numeración de puntos
   - (optional) `supabase/seed.sql` — demo users
3. In **Project Settings → API**, copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` `public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY` (secret; never expose it on the client)

### 2. GitHub

```bash
cd control-puntos
git remote add origin https://github.com/YOUR_USER/control-puntos.git
git add .
git commit -m "Checkpoint control system"
git push -u origin main
```

Do not commit `.env.local` (already in `.gitignore`).

### 3. Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New Project** → import the GitHub repo.
2. Framework: Next.js (auto-detected).
3. Environment variables (Production + Preview):

```
SESSION_SECRET=a-long-random-string
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...   # optional, push to phone
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:you@email.com
```

VAPID (optional): `npx web-push generate-vapid-keys`

4. Deploy. Every push to `main` redeploys.
5. Sign in as admin → **Config** → upload or set the alert audio.

### Important in production

- **Deployment Protection must be OFF for Production** (Project → Settings → Deployment Protection → None). If it is on, `/manifest.webmanifest` and `/sw.js` redirect to `vercel.com/sso-api`, the browser shows a CORS error, and Web Push / PWA break. Check with: `npm run check:public`.
- Without Supabase keys, Vercel would use a temporary JSON in `/tmp` (it is lost). **Always configure Supabase.**
- Alert audio is stored in the database (settings), not in environment variables.
- After the first deploy, change the admin password from **Account**.
- After setting VAPID keys, redeploy, open `/operador`, and press **Activar sonido** again (subscribe push).

## Tests

```bash
npm test                 # unit tests (alert recipients, cooldown, PWA paths)
npm run check:public     # probe production for Vercel SSO on PWA assets
```

## Architecture

- Next.js (App Router) on Vercel
- Custom auth (phone + password, JWT cookie)
- Persistence: local JSON **or** Supabase Postgres
- Checkpoint panel: Web Push + refresh on event (no polling)
- Driver: PWA + Web Push (if VAPID is set)
