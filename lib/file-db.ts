import { mkdir, readFile, rename, stat, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { ensureRoles, systemRolesSeed } from "./role-seed";
import { SYSTEM_ROLE_IDS } from "./permissions";
import type { Database } from "./types";

/** demo1234 — operadores y conductores de ejemplo */
const SEED_HASH_DEMO =
  "$2b$10$FpGoGh8IcK6mzswbcpO3QO84oiTsUB2q6JVqRM7o.Heb7VGht3f7u";
/** Contraseña1@ — admin */
const SEED_HASH_ADMIN =
  "$2b$10$dKjNHsVYgN.9uoWPCTNdWebbgjt8k1wtXPPQzJvgQgWcemDZb3XnK";

function dbPath() {
  if (process.env.DATA_DIR) return join(process.env.DATA_DIR, "db.json");
  if (process.env.VERCEL) return join("/tmp", "control-puntos-db.json");
  return join(process.cwd(), "data", "db.json");
}

function emptyDb(): Database {
  return {
    users: [],
    puntos: [],
    recorridos: [],
    busetas: [],
    horarios: [],
    alertas: [],
    registros: [],
    notificaciones: [],
    pushSubscriptions: [],
    settings: {
      alertSoundUrl: "/sounds/alerta.wav",
    },
    operatorAlertSettings: {},
    roles: systemRolesSeed(),
  };
}

export function seedDb(): Database {
  return {
    roles: systemRolesSeed(),
    users: [
      {
        id: "user-admin",
        name: "Administrador",
        phone: "3144200204",
        passwordHash: SEED_HASH_ADMIN,
        role: "admin",
        roleId: SYSTEM_ROLE_IDS.admin,
        approved: true,
        active: true,
        createdAt: "2026-01-01T00:00:00.000Z",
      },
      {
        id: "user-op-1",
        name: "Marta López",
        phone: "3000000001",
        passwordHash: SEED_HASH_DEMO,
        role: "operator",
        roleId: SYSTEM_ROLE_IDS.operator,
        puntoId: "punto-recreo",
        approved: true,
        active: true,
        createdAt: "2026-01-01T00:00:00.000Z",
      },
      {
        id: "user-drv-1",
        name: "Carlos Méndez",
        phone: "3000000002",
        passwordHash: SEED_HASH_DEMO,
        role: "driver",
        roleId: SYSTEM_ROLE_IDS.driver,
        busetaId: "buseta-12",
        approved: true,
        active: true,
        createdAt: "2026-01-01T00:00:00.000Z",
      },
      {
        id: "user-drv-2",
        name: "Ana Ruiz",
        phone: "3000000003",
        passwordHash: SEED_HASH_DEMO,
        role: "driver",
        roleId: SYSTEM_ROLE_IDS.driver,
        busetaId: "buseta-07",
        approved: true,
        active: true,
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    ],
    puntos: [
      {
        id: "punto-recreo",
        name: "El Recreo",
        address: "Cruce del negocio — control principal",
        numero: 1,
        operatorIds: ["user-op-1"],
        active: true,
      },
      {
        id: "punto-espino",
        name: "Puente El Espino",
        address: "Segundo control del recorrido",
        numero: 2,
        operatorIds: ["user-op-1"],
        active: true,
      },
    ],
    busetas: [
      { id: "buseta-12", codigo: "12", placa: "", active: true },
      { id: "buseta-07", codigo: "07", placa: "", active: true },
    ],
    recorridos: [
      {
        id: "rec-sur",
        name: "Ruta Sur",
        active: true,
        puntos: [
          { puntoId: "punto-recreo", orden: 1, tiempoEsperadoMin: 40 },
          { puntoId: "punto-espino", orden: 2, tiempoEsperadoMin: 25 },
        ],
      },
    ],
    horarios: [
      {
        id: "hor-12",
        recorridoId: "rec-sur",
        busetaId: "buseta-12",
        conductorId: "user-drv-1",
        horaSalida: "05:30",
        horaLlegada: "07:10",
        tiempoViajeMin: 100,
        dias: [1, 2, 3, 4, 5, 6],
        active: true,
      },
      {
        id: "hor-07",
        recorridoId: "rec-sur",
        busetaId: "buseta-07",
        conductorId: "user-drv-2",
        horaSalida: "05:45",
        horaLlegada: "07:25",
        tiempoViajeMin: 100,
        dias: [1, 2, 3, 4, 5, 6],
        active: true,
      },
    ],
    alertas: [],
    registros: [],
    notificaciones: [],
    pushSubscriptions: [],
    settings: {
      alertSoundUrl: "/sounds/alerta.wav",
    },
    operatorAlertSettings: {},
  };
}

let cache: Database | null = null;
let cacheMtime = 0;
let queue: Promise<unknown> = Promise.resolve();

function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(fn, fn);
  queue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

async function persist(db: Database) {
  const path = dbPath();
  await mkdir(dirname(path), { recursive: true });
  const tmp = `${path}.${process.pid}.tmp`;
  await writeFile(tmp, JSON.stringify(db, null, 2), "utf8");
  await rename(tmp, path);
  cache = db;
  try {
    cacheMtime = (await stat(path)).mtimeMs;
  } catch {
    cacheMtime = Date.now();
  }
}

export async function readDb(): Promise<Database> {
  const path = dbPath();
  try {
    const mtime = (await stat(path)).mtimeMs;
    if (cache && mtime === cacheMtime) return cache;
    const raw = await readFile(path, "utf8");
    const parsed = JSON.parse(raw) as Database;
    if (!parsed.settings) {
      parsed.settings = { alertSoundUrl: "/sounds/alerta.wav" };
    }
    if (!parsed.operatorAlertSettings) {
      parsed.operatorAlertSettings = {};
    }
    ensureRoles(parsed);
    cache = parsed;
    cacheMtime = mtime;
    return cache;
  } catch {
    const seeded = seedDb();
    await persist(seeded);
    return seeded;
  }
}

export async function updateDb<T>(mutator: (db: Database) => T): Promise<T> {
  return withLock(async () => {
    const db = structuredClone(await readDb());
    const result = mutator(db);
    await persist(db);
    return result;
  });
}

export function toPublicUser<T extends { passwordHash: string }>(user: T) {
  const { passwordHash: _h, ...rest } = user;
  return rest;
}
